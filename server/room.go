package main

type room struct {
	jsonobj           map[string]interface{}
	assignedLectures  map[*lecture]bool
	lectureCandidates []*lecture
}

func (room *room) init(jsonobj map[string]interface{}) {
	room.jsonobj = jsonobj

	room.assignedLectures = map[*lecture]bool{}
}

func (room *room) getJSONOBJ() map[string]interface{} {
	return room.jsonobj
}

func (room *room) assignLecture(lecture *lecture) {
	room.assignedLectures[lecture] = true
}

func (room *room) unassignLecture(lecture *lecture) {
	room.assignedLectures[lecture] = false
}

func (room *room) resolveLectures(state *state) bool {
	for _, lecture := range room.lectureCandidates {
		if lecture.assignedRoom != room || !(lecture.resolving || lecture.resolved) {
			success := state.resolveLecture(lecture)
			if !success {
				return false
			}
		}

	}
	return true
}

func (room *room) validLecture(lecture *lecture) bool {
	timeconflict := false
	for lec, assigned := range room.assignedLectures {

		if lec == lecture || !assigned {
			continue
		}

		if lec.assignedTimeslot != nil {
			overlap := lecture.assignedTimeslot.overlaps(lec.assignedTimeslot)
			if overlap {
				timeconflict = true
				break
			}
		}
	}
	return !timeconflict
}
