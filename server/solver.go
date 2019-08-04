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
	if lecture.resolving {
		return true
	}
	lecture.resolving = true

	var iresolveStatus bool
	var rresolveStatus bool
	var tresolveStatus bool
	titr := 0
	ritr := 0
	iitr := 0
	for lecture.setTimeslot(state) {
		titr++
		for lecture.setRoom(state) {
			ritr++
			for lecture.setInstructor(state) {
				iitr++
				iresolveStatus = state.resolveLecturesOf(lecture.assignedInstructor)
				if !iresolveStatus {
					continue
				} else {
					break
				}
			}

			if !iresolveStatus {
				lecture.resetInstructors()
				continue
			}

			rresolveStatus = state.resolveLecturesOf(lecture.assignedInstructor)
			if !rresolveStatus {
				lecture.resetInstructors()
				continue
			}

			if iresolveStatus && rresolveStatus {
				break
			}
		}

		if !rresolveStatus || !iresolveStatus {
			lecture.resetInstructors()
			lecture.resetRooms()
			continue
		}

		tresolveStatus = state.resolveLecturesOf(lecture.assignedInstructor)
		if !tresolveStatus {
			lecture.resetInstructors()
			lecture.resetRooms()
			continue
		}

		if tresolveStatus && rresolveStatus && iresolveStatus {
			break
		}
	}
	lecture.resolving = false
	if tresolveStatus && rresolveStatus && iresolveStatus {
		lecture.resolved = true
		return true
	}
	if titr > 0 && ritr == 0 {
		state.write(fmt.Sprintf("<font color=\"red\">No sutiable room for lecture %v_%v</font><br>", lecture.coursejsonobj["_id"], lecture.jsonobj["section"]))
	} else if titr == 0 || ritr == 0 || iitr == 0 {
		state.write(fmt.Sprintf("<font color=\"red\">No sutiable timeslot for lecture %v_%v</font><br>", lecture.coursejsonobj["_id"], lecture.jsonobj["section"]))
	}
	lecture.resetInstructors()
	lecture.resetRooms()
	lecture.resetTimeslots()
	return false

}

func (state *state) resolveLecturesOf(lrs lectureResolver) bool {
	return lrs.resolveLectures(state)
}
