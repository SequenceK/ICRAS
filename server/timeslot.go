package main

import (
	"fmt"
	"math"
	"strings"
)

type mtime uint32

type days struct {
	u bool
	m bool
	t bool
	w bool
	r bool
	f bool
	s bool
}

type timedata struct {
	time   mtime
	length mtime
	days   days
}

//each timeslot is 30 min
type timeslot struct {
	datahash string
	data     timedata

	assignedLectures  map[*lecture]bool
	lectureCandidates []*lecture
}

func (l *lecture) generateTimeslots(state *state) {
	daysStr := l.jsonobj["days"].(string)
	minutes := l.jsonobj["minutes"].(float64)
	ajustedMinutes := mtime(30 * math.Ceil(minutes/30))
	daysStr = strings.ToLower(daysStr)
	days := days{}
	for _, c := range daysStr {
		switch c {
		case 'u':
			days.u = true
			break
		case 'm':
			days.m = true
			break
		case 't':
			days.t = true
			break
		case 'w':
			days.w = true
			break
		case 'r':
			days.r = true
			break
		case 's':
			days.s = true
			break
		case 'f':
			days.f = true
			break
		default:
			panic(fmt.Errorf("Unsupported days letter %U", c))
		}
	}
	stime := toTime("08:00")
	etime := toTime("20:00")

	for time := stime; time < etime; time += ajustedMinutes {
		var data timedata
		data.days = days
		data.length = mtime(minutes)
		data.time = time

		hash := fmt.Sprintf("%v%s-%s", data.days, timeToString(data.time), timeToString(data.time+data.length))
		//fmt.Println(hash)
		ts, ok := state.timeslots[hash]
		if !ok || ts == nil {
			ts = &timeslot{}
			state.timeslots[hash] = ts
			ts.datahash = hash
			ts.data = data
			ts.assignedLectures = map[*lecture]bool{}
		}
		if l.constraints.checkTimeslot(ts) {
			ts.lectureCandidates = append(ts.lectureCandidates, l)
			l.timeslots = append(l.timeslots, ts)
		}
	}
}

func (timeslot *timeslot) overlaps(timeslot2 *timeslot) bool {
	d1 := timeslot.data.days
	d2 := timeslot2.data.days

	dayoverlap := false

	dayoverlap = dayoverlap || ((d1.u == d2.u) && d1.u)
	dayoverlap = dayoverlap || ((d1.m == d2.m) && d1.m)
	dayoverlap = dayoverlap || ((d1.t == d2.t) && d1.t)
	dayoverlap = dayoverlap || ((d1.w == d2.w) && d1.w)
	dayoverlap = dayoverlap || ((d1.r == d2.r) && d1.r)
	dayoverlap = dayoverlap || ((d1.f == d2.f) && d1.f)
	dayoverlap = dayoverlap || ((d1.s == d2.s) && d1.s)

	st1 := timeslot.data.time
	et1 := timeslot.data.time + timeslot.data.length
	st2 := timeslot2.data.time
	et2 := timeslot2.data.time + timeslot2.data.length

	//fmt.Printf("%s-%s %s-%s %t %t\n", timeToString(st1), timeToString(et1), timeToString(st2), timeToString(et2), dayoverlap, dayoverlap && ((st1 <= (et2) && st1 >= st2) || (st2 <= (et1) && st2 >= st1)))

	return dayoverlap && ((st1 <= (et2) && st1 >= st2) || (st2 <= (et1) && st2 >= st1))
}

func (d days) String() string {
	str := ""
	if d.u {
		str += "U"
	}
	if d.m {
		str += "M"
	}
	if d.t {
		str += "T"
	}
	if d.w {
		str += "W"
	}
	if d.r {
		str += "R"
	}
	if d.f {
		str += "F"
	}
	if d.s {
		str += "S"
	}

	return str
}

func timeToString(time mtime) string {
	hour := int(time / 60)
	minute := time % 60

	return fmt.Sprintf("%02d:%02d", hour, minute)
}

func (timeslot *timeslot) assignLecture(lecture *lecture) {
	timeslot.assignedLectures[lecture] = true
}

func (timeslot *timeslot) unassignLecture(lecture *lecture) {
	timeslot.assignedLectures[lecture] = false
}

func (timeslot *timeslot) resolveLectures(state *state) bool {
	for _, lecture := range timeslot.lectureCandidates {
		if lecture.assignedTimeslot != timeslot || !(lecture.resolving || lecture.resolved) {
			success := state.resolveLecture(lecture)
			if !success {
				return false
			}
		}

	}
	return true
}
