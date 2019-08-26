package main

import "fmt"

type resolverStatus struct {
	toLecture *lecture
	status    *rsStatus
}

type rsStatus int

const (
	rsSuccess rsStatus = iota
	rsRoomFailed
	rsInstructorFailed
	rsTimeSlotFailed
)

type lectureResolver interface {
	resolveLectures(state *state) bool
}

func check(err error) {
	if err != nil {
		panic(err)
	}
}

func (state *state) err(err error) {
	check(err)
}

func (state *state) solve() {
	for _, lecture := range state.lectures {
		if !lecture.resolved {
			state.write(fmt.Sprintf("resolving lecture %s_%v<br>", lecture.course.name, lecture.jsonobj["section"]))
			status := state.resolveLecture(lecture)
			if !status {
				state.write(fmt.Sprintf("<font color=\"red\">failed to fully resolve state</font><br>"))
			}
		}
	}
}

func (state *state) resolveLecture(lecture *lecture) bool {
	if state.courseMaxInstructors[lecture.course.name] == state.courseAssignedInstructors[lecture.course.name] {
		//state.write(fmt.Sprintf("<font color=\"red\"> Not enough instructors assinged to Course %s</font><br>", lecture.course.name))
		lecture.resolved = true
		return true
	}

	lecture.resolving = true

	assigned := 0
	for _, ins := range lecture.instructorCandidates {
		if ins.lectureAssigmentCount[lecture.course.name] == ins.lectureAssigmentLimit[lecture.course.name] {
			assigned++
		}
	}

	// if assigned == len(lecture.instructorCandidates) {
	// 	state.write(fmt.Sprintf("<font color=\"red\"> No available instructor candidates for  %s_%v</font><br>", lecture.course.name, lecture.jsonobj["section"]))
	// 	lecture.resolved = true
	// 	return true
	// }

	var iresolveStatus bool
	var rresolveStatus bool
	var tresolveStatus bool
	titr := 0
	ritr := 0
	iitr := 0
	for lecture.setTimeslot(state) {
		//state.write(fmt.Sprintf("<font color=\"blue\">lecture %v_%v, timeslot %s</font><br>", lecture.course.name, lecture.jsonobj["section"], timeToString(lecture.assignedTimeslot.data.time)))
		titr++
		for lecture.setRoom(state) {
			//state.write(fmt.Sprintf("<font color=\"blue\">lecture %v_%v, room %s</font><br>", lecture.course.name, lecture.jsonobj["section"], lecture.assignedRoom.jsonobj["_id"]))
			ritr++
			for lecture.setInstructor(state) {
				//state.write(fmt.Sprintf("<font color=\"blue\">lecture %v_%v, instructor %s rank %d</font><br>", lecture.course.name, lecture.jsonobj["section"], lecture.assignedInstructor.jsonobj["_id"], lecture.assignedInstructor.rank+lecture.assignedInstructor.courseRank[lecture.course.name]))
				iitr++
				iresolveStatus = state.resolveLecturesOf(lecture.assignedInstructor)
				if !iresolveStatus {
					continue
				} else {
					break
				}
			}

			if !iresolveStatus {
				lecture.resetInstructors(state)
				continue
			}

			rresolveStatus = state.resolveLecturesOf(lecture.assignedRoom)
			if !rresolveStatus {
				lecture.resetInstructors(state)
				iresolveStatus = false
				continue
			}

			if iresolveStatus && rresolveStatus {
				break
			}
		}

		if !rresolveStatus || !iresolveStatus {
			lecture.resetInstructors(state)
			lecture.resetRooms()
			continue
		}

		tresolveStatus = state.resolveLecturesOf(lecture.assignedTimeslot)
		if !tresolveStatus {
			lecture.resetInstructors(state)
			lecture.resetRooms()
			iresolveStatus = false
			tresolveStatus = false
			continue
		}

		if tresolveStatus && rresolveStatus && iresolveStatus {
			break
		}
	}

	if tresolveStatus && rresolveStatus && iresolveStatus {
		lecture.resolving = false
		lecture.resolved = true
		return true
	}
	// if titr > 0 && ritr > 0 && iitr == 0 {
	// 	state.write(fmt.Sprintf("<font color=\"red\">No sutiable instructor for lecture %v_%v</font><br>", lecture.coursejsonobj["_id"], lecture.jsonobj["section"]))
	// } else if titr > 0 && ritr == 0 {
	// 	state.write(fmt.Sprintf("<font color=\"red\">No sutiable room for lecture %v_%v</font><br>", lecture.coursejsonobj["_id"], lecture.jsonobj["section"]))
	// } else if titr == 0 || ritr == 0 || iitr == 0 {
	// 	state.write(fmt.Sprintf("<font color=\"red\">No sutiable timeslot for lecture %v_%v</font><br>", lecture.coursejsonobj["_id"], lecture.jsonobj["section"]))
	// }
	lecture.resetInstructors(state)
	lecture.resetRooms()
	lecture.resetTimeslots()
	//state.write(fmt.Sprintf("<font color=\"red\">failed to resolve lecture %v_%v</font><br>", lecture.course.name, lecture.jsonobj["section"]))
	lecture.resolving = false
	return false

}

func (state *state) resolveLecturesOf(lrs lectureResolver) bool {
	return lrs.resolveLectures(state)
}
