package main

type course struct {
	jsonobj     map[string]interface{}
	name        string
	constraints *constraints

	departments map[*department]bool
}

type lecture struct {
	coursejsonobj map[string]interface{}
	course        *course
	jsonobj       map[string]interface{}
	constraints   *constraints

	assignedInstructor   *instructor
	instructorCandidates []*instructor
	vistedInstructors    map[string]bool

	assignedRoom   *room
	roomCandidates []*room
	vistedRooms    map[*room]bool

	assignedTimeslot *timeslot
	timeslots        []*timeslot
	vistedTimeslots  map[*timeslot]bool

	resolved  bool
	resolving bool
}

func (course *course) init(state *state, jsonobj map[string]interface{}) {
	course.jsonobj = jsonobj
	course.name = jsonobj["_id"].(string)
	course.departments = map[*department]bool{}

	for _, dep := range state.departments {
		if dep.containsCourse(course.name) {
			course.departments[dep] = true
		}
	}
}

func (lecture *lecture) init(coursejsonobj, jsonobj map[string]interface{}) {
	lecture.jsonobj = jsonobj
	lecture.coursejsonobj = coursejsonobj
	lecture.vistedTimeslots = map[*timeslot]bool{}
	lecture.vistedInstructors = map[string]bool{}
	lecture.vistedRooms = map[*room]bool{}
}

func (course *course) getJSONOBJ() map[string]interface{} {
	return course.jsonobj
}

func (lecture *lecture) getJSONOBJ() map[string]interface{} {
	return lecture.jsonobj
}

func (lecture *lecture) setTimeslot(state *state) bool {
	if lecture.assignedTimeslot != nil {
		lecture.unassignTimeslot()
	}
	for _, timeslot := range lecture.timeslots {
		if !lecture.vistedTimeslots[timeslot] {
			lecture.assignTimeslot(timeslot)
			lecture.vistedTimeslots[timeslot] = true
			return true
		}
	}
	return false
}

func (lecture *lecture) setRoom(state *state) bool {
	if lecture.assignedRoom != nil {
		lecture.unassignRoom()
	}
	for _, room := range lecture.roomCandidates {
		if !lecture.vistedRooms[room] && room.validLecture(lecture) {
			lecture.assignRoom(room)
			lecture.vistedRooms[room] = true
			return true
		}
	}
	return false
}

func (lecture *lecture) setInstructor(state *state) bool {
	if lecture.assignedInstructor != nil {
		lecture.unassignInstructor(state)
	}
	for _, instructor := range lecture.instructorCandidates {
		if !lecture.vistedInstructors[instructor.name] && instructor.validLecture(lecture, state) {
			lecture.vistedInstructors[instructor.name] = true
			lecture.assignInstructor(instructor, state)

			return true
		}
		// } else {
		// 	state.write(fmt.Sprintf("instructor %v is invalid", instructor.jsonobj["_id"]))
		// }
	}
	return false
}

func (lecture *lecture) assignInstructor(instructor *instructor, state *state) {
	lecture.assignedInstructor = instructor
	instructor.assignLecture(lecture, state)
}

func (lecture *lecture) assignRoom(room *room) {
	lecture.assignedRoom = room
	room.assignLecture(lecture)
}

func (lecture *lecture) assignTimeslot(timeslot *timeslot) {
	lecture.assignedTimeslot = timeslot
	timeslot.assignLecture(lecture)
}

func (lecture *lecture) unassignInstructor(state *state) {
	lecture.assignedInstructor.unassignLecture(lecture, state)
	lecture.assignedInstructor = nil
}

func (lecture *lecture) unassignRoom() {
	lecture.assignedRoom.unassignLecture(lecture)
	lecture.assignedRoom = nil
}

func (lecture *lecture) unassignTimeslot() {
	lecture.assignedTimeslot.unassignLecture(lecture)
	lecture.assignedTimeslot = nil
}

func (lecture *lecture) resetRooms() {
	if lecture.assignedRoom != nil {
		lecture.unassignRoom()
	}

	lecture.vistedRooms = map[*room]bool{}
}

func (lecture *lecture) resetInstructors(state *state) {
	if lecture.assignedInstructor != nil {
		lecture.unassignInstructor(state)
	}
	lecture.vistedInstructors = map[string]bool{}
}

func (lecture *lecture) resetTimeslots() {
	if lecture.assignedTimeslot != nil {
		lecture.unassignTimeslot()
	}
	lecture.vistedTimeslots = map[*timeslot]bool{}
}
