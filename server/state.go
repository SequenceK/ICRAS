package main

import (
	"fmt"

	"github.com/360EntSecGroup-Skylar/excelize/v2"
)

type state struct {
	instructors       []*instructor
	coursesLectureMap map[string][]*lecture
	lectures          []*lecture
	rooms             []*room
	timeslots         map[string]*timeslot
}

func initState() *state {
	state := &state{}

	//load instructors
	instructorsList, err := DBAll("instructors")
	check(err)
	state.instructors = make([]*instructor, len(instructorsList))
	for i, id := range instructorsList {
		instructorJSON, err := DBGet("instructors", id)
		check(err)

		state.instructors[i] = &instructor{}
		state.instructors[i].init(instructorJSON)
	}

	//load lectures(through courses)
	courseList, err := DBAll("courses")
	coursesObj := make([]map[string]interface{}, 0)
	lectureCount := 0
	check(err)
	for _, id := range courseList {
		courseJSON, err := DBGet("courses", id)
		check(err)

		coursesObj = append(coursesObj, courseJSON)
		lectures := courseJSON["lectures"].([]interface{})
		lectureCount += len(lectures)
	}
	state.lectures = make([]*lecture, lectureCount)
	state.coursesLectureMap = make(map[string][]*lecture, len(courseList))
	lectureIndex := 0
	for i, obj := range coursesObj {
		courseName := courseList[i]
		course := &course{}
		course.jsonobj = obj
		course.name = courseName
		lectures := obj["lectures"].([]interface{})
		state.coursesLectureMap[courseName] = make([]*lecture, len(lectures))
		for j, lobj := range lectures {
			state.lectures[lectureIndex+j] = &lecture{}
			state.lectures[lectureIndex+j].course = course
			state.lectures[lectureIndex+j].init(obj, lobj.(map[string]interface{}))
			state.coursesLectureMap[courseName][j] = state.lectures[lectureIndex+j]
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
				lec.instructorCandidates = append(lec.instructorCandidates, instructor)
				instructor.lectureCandidates[courseID] = append(instructor.lectureCandidates[courseID], lec)
			}

		}
	}

	//generate room candidates and timeslots
	for _, lecture := range state.lectures {
		for _, room := range state.rooms {
			if lecture.constraints.check(room) {
				lecture.roomCandidates = append(lecture.roomCandidates, room)
				room.lectureCandidates = append(room.lectureCandidates, lecture)
			}
		}

		lecture.generateTimeslots(state)
	}
}

func (state *state) generateXLSX() *excelize.File {
	f := excelize.NewFile()
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

	for i, lecture := range state.lectures {
		f.SetCellValue("lectures", fmt.Sprintf("A%d", i+2), lecture.coursejsonobj["_id"])
		f.SetCellValue("lectures", fmt.Sprintf("B%d", i+2), lecture.jsonobj["section"])
		f.SetCellValue("lectures", fmt.Sprintf("C%d", i+2), lecture.coursejsonobj["title"])
		f.SetCellValue("lectures", fmt.Sprintf("D%d", i+2), lecture.jsonobj["contacthours(lec/stu)"])
		f.SetCellValue("lectures", fmt.Sprintf("E%d", i+2), lecture.jsonobj["contacthours(lab/rec)"])
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
	// Set active sheet of the workbook.
	f.SetActiveSheet(index)
	// Save xlsx file by the given path.
	return f
}
