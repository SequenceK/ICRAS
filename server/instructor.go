package main

type instructor struct {
	jsonobj               map[string]interface{}
	name                  string
	teaches               []string
	assignedLectures      map[*lecture]bool
	lectureCandidates     map[string][]*lecture
	courseConstraints     map[string]*constraints
	lectureAssigmentLimit map[string]int
	lectureAssigmentCount map[string]int
	constraints           *constraints
	courseRank            map[string]uint
	rank                  uint
}

func (instructor *instructor) init(jsonobj map[string]interface{}, state *state) {
	instructor.jsonobj = jsonobj
	instructor.name = jsonobj["_id"].(string)
	teachesList := jsonobj["instructs"].([]interface{})
	instructor.assignedLectures = map[*lecture]bool{}
	instructor.lectureCandidates = map[string][]*lecture{}
	instructor.lectureAssigmentLimit = map[string]int{}
	instructor.lectureAssigmentCount = map[string]int{}
	instructor.courseConstraints = map[string]*constraints{}
	instructor.courseRank = map[string]uint{}
	instructor.constraints = &constraints{}
	instructor.constraints.init(jsonobj)

	instructor.teaches = make([]string, len(teachesList))
	for i, id := range teachesList {
		obj := id.(map[string]interface{})
		course := obj["course"].(string)
		max := int(obj["maxlectures"].(float64))
		state.courseMaxInstructors[course] += uint(max)
		instructor.courseConstraints[course] = &constraints{}
		instructor.courseConstraints[course].init(obj)

		instructor.teaches[i] = course
		instructor.lectureAssigmentLimit[course] = max
	}
}

func (instructor *instructor) getJSONOBJ() map[string]interface{} {
	return instructor.jsonobj
}

func (instructor *instructor) assignLecture(lecture *lecture, state *state) {
	instructor.assignedLectures[lecture] = true
	instructor.lectureAssigmentCount[lecture.course.name]++
	state.courseAssignedInstructors[lecture.course.name]++
}

func (instructor *instructor) unassignLecture(lecture *lecture, state *state) {
	instructor.assignedLectures[lecture] = false
	instructor.lectureAssigmentCount[lecture.course.name]--
	state.courseAssignedInstructors[lecture.course.name]--
}

func (instructor *instructor) resolveLectures(state *state) bool {
	for _, v := range instructor.lectureCandidates {
		for _, lecture := range v {
			if lecture.assignedInstructor != instructor && !(lecture.resolving || lecture.resolved) {
				//state.write(fmt.Sprintf("<font color=\"orange\">lecture %v_%v resolving %v</font><br>", lecture.course.name, lecture.jsonobj["section"], lecture.resolving))
				success := state.resolveLecture(lecture)
				if !success {
					return false
				}
			}
		}
	}

	return true
}

func (instructor *instructor) validLecture(lecture *lecture, state *state) bool {
	timeconflict := false
	maxlimit := false
	for lec, assigned := range instructor.assignedLectures {
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

	if !timeconflict {
		timeconflict = timeconflict || !instructor.constraints.checkTimeslot(lecture.assignedTimeslot)
		for _, cns := range instructor.courseConstraints {
			timeconflict = timeconflict || !cns.checkTimeslot(lecture.assignedTimeslot)
		}
	}
	if instructor.lectureAssigmentCount[lecture.course.name] == instructor.lectureAssigmentLimit[lecture.course.name] {
		maxlimit = true
	}
	return !timeconflict && !maxlimit
}

func (instructor *instructor) generateRank(state *state) {
	for _, timeslot := range state.timeslots {
		if instructor.constraints.checkTimeslot(timeslot) {
			instructor.rank++
		}
		for course, cons := range instructor.courseConstraints {
			if cons.checkTimeslot(timeslot) {
				instructor.courseRank[course]++
			}
		}
	}

}
