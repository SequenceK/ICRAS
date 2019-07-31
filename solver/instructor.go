package main

type instructor struct {
	jsonobj               map[string]interface{}
	name                  string
	teaches               []string
	assignedLectures      map[*lecture]bool
	lectureCandidates     map[string][]*lecture
	lectureAssigmentLimit map[string]int
	lectureAssigmentCount map[string]int
}

func (instructor *instructor) init(jsonobj map[string]interface{}) {
	instructor.jsonobj = jsonobj
	instructor.name = jsonobj["_id"].(string)
	teachesList := jsonobj["instructs"].([]interface{})
	instructor.assignedLectures = map[*lecture]bool{}
	instructor.lectureCandidates = map[string][]*lecture{}
	instructor.lectureAssigmentLimit = map[string]int{}
	instructor.lectureAssigmentCount = map[string]int{}
	instructor.teaches = make([]string, len(teachesList))
	for i, id := range teachesList {
		obj := id.(map[string]interface{})
		course := obj["course"].(string)
		max := int(obj["maxlectures"].(float64))

		instructor.teaches[i] = course
		instructor.lectureAssigmentLimit[course] = max
	}
}

func (instructor *instructor) getJSONOBJ() map[string]interface{} {
	return instructor.jsonobj
}

func (instructor *instructor) assignLecture(lecture *lecture) {
	instructor.assignedLectures[lecture] = true
	instructor.lectureAssigmentCount[lecture.course.name]++
}

func (instructor *instructor) unassignLecture(lecture *lecture) {
	instructor.assignedLectures[lecture] = false
	instructor.lectureAssigmentCount[lecture.course.name]--
}

func (instructor *instructor) resolveLectures(state *state) bool {
	for k, v := range instructor.lectureCandidates {
		if instructor.lectureAssigmentCount[k] < instructor.lectureAssigmentLimit[k] || instructor.lectureAssigmentLimit[k] == 0 {
			for _, lecture := range v {
				if lecture.assignedInstructor != instructor || !(lecture.resolving || lecture.resolved) {
					success := state.resolveLecture(lecture)
					if !success {
						return false
					}
				}
			}
		}
	}

	return true
}

func (instructor *instructor) validLecture(lecture *lecture) bool {
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
	if instructor.lectureAssigmentCount[lecture.course.name] == instructor.lectureAssigmentLimit[lecture.course.name] {
		maxlimit = true
	}

	return !timeconflict && !maxlimit
}
