package main

import (
	"fmt"
	"sort"

	"github.com/360EntSecGroup-Skylar/excelize/v2"
	"golang.org/x/net/websocket"
)

type state struct {
	departments               []*department
	instructors               []*instructor
	coursesLectureMap         map[string][]*lecture
	courseMaxInstructors      map[string]uint
	courseAssignedInstructors map[string]uint
	lectures                  []*lecture
	rooms                     []*room
	timeslots                 map[string]*timeslot
	ws                        *websocket.Conn
}

func (state *state) write(msg interface{}) {
	websocket.Message.Send(state.ws, msg)
}

func initState(ws *websocket.Conn) *state {
	state := &state{}
	state.ws = ws
	state.courseMaxInstructors = map[string]uint{}
	state.courseAssignedInstructors = map[string]uint{}

	departments, err := DBAll("departments")
	check(err)
	state.departments = make([]*department, len(departments))
	for i, did := range departments {
		departmentobj, err := DBGet("departments", did)
		check(err)

		state.departments[i] = &department{}
		state.departments[i].init(departmentobj)
	}

	//load instructors
	instructorsList, err := DBAll("instructors")
	check(err)
	state.instructors = make([]*instructor, len(instructorsList))
	for i, id := range instructorsList {
		instructorJSON, err := DBGet("instructors", id)
		check(err)

		state.instructors[i] = &instructor{}
		state.instructors[i].init(instructorJSON, state)
		i++
	}

	//load lectures(through courses)
	courseList, err := DBAll("courses")
	check(err)
	coursesObj := make([]map[string]interface{}, len(courseList))
	lectureCount := 0

	for i, id := range courseList {
		courseJSON, err := DBGet("courses", id)
		check(err)

		coursesObj[i] = courseJSON
		_, ok := courseJSON["lectures"]
		if ok {
			lectures := courseJSON["lectures"].([]interface{})
			lectureCount += len(lectures)
		}
	}
	state.lectures = make([]*lecture, lectureCount)
	state.coursesLectureMap = make(map[string][]*lecture, len(courseList))
	lectureIndex := 0
	for _, obj := range coursesObj {
		course := &course{}
		course.init(state, obj)

		_, ok := obj["lectures"]
		if !ok {
			continue
		}
		lectures := obj["lectures"].([]interface{})
		state.coursesLectureMap[course.name] = make([]*lecture, len(lectures))
		for j, lobj := range lectures {
			state.lectures[lectureIndex+j] = &lecture{}
			state.lectures[lectureIndex+j].course = course
			state.lectures[lectureIndex+j].init(obj, lobj.(map[string]interface{}))
			state.coursesLectureMap[course.name][j] = state.lectures[lectureIndex+j]
		}
		lectureIndex += len(lectures)
	}

	//load rooms
	roomList, err := DBAll("rooms")
	check(err)
	state.rooms = make([]*room, len(roomList))
	for i, id := range roomList {
		roomJSON, err := DBGet("rooms", id)
		check(err)

		state.rooms[i] = &room{}
		state.rooms[i].init(roomJSON)
		i++
	}

	state.timeslots = map[string]*timeslot{}
	return state
}

func (state *state) generateCandidates() {
	//generate instructor candidates
	for _, instructor := range state.instructors {
		for _, courseID := range instructor.teaches {
			if instructor.lectureCandidates[courseID] == nil {
				instructor.lectureCandidates[courseID] = []*lecture{}
			}
			for _, lec := range state.coursesLectureMap[courseID] {
				if instructor.courseConstraints[courseID].check(lec) {
					lec.instructorCandidates = append(lec.instructorCandidates, instructor)
					instructor.lectureCandidates[courseID] = append(instructor.lectureCandidates[courseID], lec)
				}
			}

		}
	}

	//generate room candidates and timeslots
	for _, lecture := range state.lectures {
		for _, room := range state.rooms {
			deptcheck := true
			for dep, ok := range lecture.course.departments {
				if !ok {
					continue
				}
				deptcheck = deptcheck && dep.containsRoom(room.jsonobj["_id"].(string))
			}
			if lecture.constraints.check(room) && deptcheck {
				lecture.roomCandidates = append(lecture.roomCandidates, room)
				room.lectureCandidates = append(room.lectureCandidates, lecture)
			}
		}

		lecture.generateTimeslots(state)
	}
}

func (state *state) rankCandidates() {
	for _, ins := range state.instructors {
		ins.generateRank(state)
	}

	for _, lec := range state.lectures {
		sort.SliceStable(lec.instructorCandidates, func(i int, j int) bool {
			irank := lec.instructorCandidates[i].rank + lec.instructorCandidates[i].courseRank[lec.course.name]
			jrank := lec.instructorCandidates[j].rank + lec.instructorCandidates[j].courseRank[lec.course.name]
			return irank < jrank
		})
	}
}

func (state *state) checkLogic() {
	for _, ins := range state.instructors {
		cslots := 0
		for c, limit := range ins.lectureAssigmentLimit {
			cslots += limit
			//state.write(fmt.Sprintf("instructor %s course %s limit %d rank %d crank %d <br>", ins.name, c, limit, ins.rank, ins.courseRank[c]))
			if (int(ins.courseRank[c]) < limit) || (int(ins.rank) < limit) {
				state.write(fmt.Sprintf("<font color=\"red\">logic error: not enough timeslots for instructor %s</font><br>", ins.name))
				if int(ins.rank) < limit {
					state.courseMaxInstructors[c] -= uint(limit - int(ins.rank))
					ins.lectureAssigmentLimit[c] = int(ins.rank)
				} else {
					state.courseMaxInstructors[c] -= uint(limit - int(ins.courseRank[c]))
					ins.lectureAssigmentLimit[c] = int(ins.courseRank[c])
				}
			}

		}

	}
}

func (state *state) generateXLSX() {
	files := map[*department]*excelize.File{}
	for _, dep := range state.departments {
		files[dep] = excelize.NewFile()
		f := files[dep]
		f.SetSheetName("Sheet1", "lectures")
		index := f.GetSheetIndex("lectures")
		// Set value of a cell.
		f.SetCellValue("lectures", "A1", "Course")
		f.SetCellValue("lectures", "B1", "Section")
		f.SetCellValue("lectures", "C1", "Title")
		f.SetCellValue("lectures", "D1", "Contact Hours(lec/stu)")
		f.SetCellValue("lectures", "E1", "Contact Hours(lab/rec)")
		f.SetCellValue("lectures", "F1", "Credits")
		f.SetCellValue("lectures", "G1", "Max. Capacity")
		f.SetCellValue("lectures", "H1", "Days")
		f.SetCellValue("lectures", "I1", "Hours from-to")
		f.SetCellValue("lectures", "J1", "Room")
		f.SetCellValue("lectures", "K1", "Instructor")
		f.SetCellValue("lectures", "L1", "Status")
		f.SetCellValue("lectures", "M1", "Remarks")
		f.SetCellValue("lectures", "N1", "Soft Capacity")
		f.SetColWidth("lectures", "C", "C", 30)
		f.SetActiveSheet(index)
	}

	for i, lecture := range state.lectures {
		for dep, ok := range lecture.course.departments {
			if !ok {
				continue
			}
			f := files[dep]
			f.SetCellValue("lectures", fmt.Sprintf("A%d", i+2), lecture.coursejsonobj["_id"])
			f.SetCellValue("lectures", fmt.Sprintf("B%d", i+2), lecture.jsonobj["section"])
			f.SetCellValue("lectures", fmt.Sprintf("C%d", i+2), lecture.coursejsonobj["title"])
			f.SetCellValue("lectures", fmt.Sprintf("D%d", i+2), lecture.coursejsonobj["contacthours(lec/stu)"])
			f.SetCellValue("lectures", fmt.Sprintf("E%d", i+2), lecture.coursejsonobj["contacthours(lab/rec)"])
			f.SetCellValue("lectures", fmt.Sprintf("F%d", i+2), lecture.coursejsonobj["credits"])
			f.SetCellValue("lectures", fmt.Sprintf("N%d", i+2), lecture.jsonobj["capacity"])
			if lecture.assignedInstructor != nil {
				f.SetCellValue("lectures", fmt.Sprintf("K%d", i+2), lecture.assignedInstructor.jsonobj["_id"])
			}
			if lecture.assignedRoom != nil {
				f.SetCellValue("lectures", fmt.Sprintf("J%d", i+2), lecture.assignedRoom.jsonobj["_id"].(string))
				f.SetCellValue("lectures", fmt.Sprintf("G%d", i+2), lecture.assignedRoom.jsonobj["capacity"])
			}
			if lecture.assignedTimeslot != nil {
				ts := lecture.assignedTimeslot
				f.SetCellValue("lectures", fmt.Sprintf("H%d", i+2), ts.data.days)
				start := timeToString(ts.data.time)
				end := timeToString(ts.data.time + ts.data.length)
				f.SetCellValue("lectures", fmt.Sprintf("I%d", i+2), fmt.Sprintf("%s-%s", start, end))
			}
		}
	}

	for _, dep := range state.departments {
		json := map[string]interface{}{}
		json["_id"] = dep.jsonobj["_id"]
		buffer, _ := files[dep].WriteToBuffer()
		json["blob"] = buffer.Bytes()

		DBPut("timetables", json["_id"].(string), json)
	}
}
