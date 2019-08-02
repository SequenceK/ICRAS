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
			status := state.resolveLecture(lecture)
			fmt.Printf("status %t\n", status)
		}
	}
}

func (state *state) resolveLecture(lecture *lecture) bool {
	if lecture.resolving {
		return true
	}
	lecture.resolving = true
	fmt.Printf("resolving lecture %s_%v\n", lecture.course.name, lecture.jsonobj["section"])
	var iresolveStatus bool
	var rresolveStatus bool
	var tresolveStatus bool
	for lecture.setTimeslot(state) {
		//fmt.Printf("timeslot %v set\n", lecture.assignedTimeslot.data.time)
		for lecture.setRoom(state) {
			//fmt.Printf("room %v set\n", lecture.assignedRoom.jsonobj["_id"])
			for lecture.setInstructor(state) {
				//fmt.Printf("instrutor %v set\n", lecture.assignedInstructor.name)
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

	lecture.resetInstructors()
	lecture.resetRooms()
	lecture.resetTimeslots()
	return false

}

func (state *state) resolveLecturesOf(lrs lectureResolver) bool {
	return lrs.resolveLectures(state)
}
