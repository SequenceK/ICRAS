package main

import (
	"fmt"
	"strings"
	"time"

	"github.com/360EntSecGroup-Skylar/excelize/v2"
)

type objectjson interface {
	getJSONOBJ() map[string]interface{}
}

type instructor struct {
	jsonobj          map[string]interface{}
	name             string
	teaches          []string
	assignedLectures []*lecture
}

type course struct {
	jsonobj     map[string]interface{}
	constraints *constraints
}

type lecture struct {
	coursejsonobj map[string]interface{}
	course        *course
	jsonobj       map[string]interface{}
	constraints   *constraints

	assignedInstructor *instructor

	assignedRoom   *room
	roomCandidates []*room

	selectedTimeslot  timeslot
	bestTimeslots     []timeslot
	possibleTimeslots []timeslot
}

type constraintValueType int

const (
	stringvalue constraintValueType = iota
	intvalue
	timevalue
	boolvalue
	pointervalue
)

type constraintAction int

const (
	eq constraintAction = iota
	gt
	lt
	bt
)

type constraintParentType int

const (
	nonetype constraintParentType = iota
	roomtype
	lecturetype
	coursetype
	instructortype
)

type constraintVariable interface{}
type constraint struct {
	varsnum  int
	vars     []constraintVariable
	baseType constraintValueType

	on         string
	onfull     string
	parentType constraintParentType

	getvar        func(string, map[string]interface{}) interface{}
	satisfyAction func(constraintAction, *constraint, interface{}) bool

	action constraintAction
}

type constraints struct {
	constraints     []*constraint
	timeconstraints []*constraint
}

type room struct {
	jsonobj map[string]interface{}

	assignedTimeslots []timeslot
}

type timetable struct {
	slots []timeslot
}

type timeslot struct {
	days   days
	time   uint32
	length uint32
}

type days struct {
	u bool
	m bool
	t bool
	w bool
	r bool
	f bool
	s bool
}

type state struct {
	instructors       []*instructor
	coursesLectureMap map[string][]*lecture
	lectures          []*lecture
	rooms             []*room
}

func check(err error) {
	if err != nil {
		panic(err)
	}
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
		lectures := obj["lectures"].([]interface{})
		state.coursesLectureMap[courseName] = make([]*lecture, len(lectures))
		for j, lobj := range lectures {
			state.lectures[lectureIndex+j] = &lecture{}
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

	return state
}

func (instructor *instructor) init(jsonobj map[string]interface{}) {
	instructor.jsonobj = jsonobj
	instructor.name = jsonobj["_id"].(string)
	teachesList := jsonobj["teaches"].([]interface{})
	instructor.teaches = make([]string, len(teachesList))
	for i, id := range teachesList {
		instructor.teaches[i] = id.(string)
	}
}

func (lecture *lecture) init(coursejsonobj, jsonobj map[string]interface{}) {
	lecture.jsonobj = jsonobj
	lecture.coursejsonobj = coursejsonobj
}

func (room *room) init(jsonobj map[string]interface{}) {
	room.jsonobj = jsonobj
}

func (instructor *instructor) getJSONOBJ() map[string]interface{} {
	return instructor.jsonobj
}
func (course *course) getJSONOBJ() map[string]interface{} {
	return course.jsonobj
}
func (lecture *lecture) getJSONOBJ() map[string]interface{} {
	return lecture.jsonobj
}
func (room *room) getJSONOBJ() map[string]interface{} {
	return room.jsonobj
}

func getConstraintType(jsonobj map[string]interface{}) (bool, string, string, string) {
	selectedOn := jsonobj["selectedOn"].(string)
	ids := strings.Split(selectedOn, ".")
	len := len(ids)
	if len >= 2 {
		return true, jsonobj["type"].(string), ids[len-1], ids[len-2]
	}

	return false, jsonobj["type"].(string), ids[len-1], ""
}

func toTime(value string) uint32 {
	baset, _ := time.Parse("RFC3339", "00:00")
	t, _ := time.Parse("RFC3339", value)
	return uint32(t.Sub(baset).Minutes())
}

func getTime(id string, jsonobj map[string]interface{}) interface{} {
	value := jsonobj[id].(string)
	return toTime(value)
}

func getString(id string, jsonobj map[string]interface{}) interface{} {
	value := jsonobj[id].(string)
	return value
}

func getInt(id string, jsonobj map[string]interface{}) interface{} {
	value := jsonobj[id].(float64)
	return int(value)
}

func getBool(id string, jsonobj map[string]interface{}) interface{} {
	value := jsonobj[id].(bool)
	return value
}

func satisfyTime(action constraintAction, constraint *constraint, checkvalue interface{}) bool {
	switch action {
	case eq:
		return checkvalue.(uint32) == constraint.vars[0].(uint32)
	case gt:
		return checkvalue.(uint32) > constraint.vars[0].(uint32)
	case lt:
		return checkvalue.(uint32) < constraint.vars[0].(uint32)
	case bt:
		return checkvalue.(uint32) > constraint.vars[0].(uint32) &&
			checkvalue.(uint32) < constraint.vars[1].(uint32)
	}

	return false
}
func satisfyString(action constraintAction, constraint *constraint, checkvalue interface{}) bool {
	switch action {
	case eq:
		return checkvalue.(string) == constraint.vars[0].(string)
	case gt:
		return checkvalue.(string) > constraint.vars[0].(string)
	case lt:
		return checkvalue.(string) < constraint.vars[0].(string)
	case bt:
		return checkvalue.(string) > constraint.vars[0].(string) &&
			checkvalue.(string) < constraint.vars[1].(string)
	}

	return false
}
func satisfyInt(action constraintAction, constraint *constraint, checkvalue interface{}) bool {
	switch action {
	case eq:
		return checkvalue.(int) == constraint.vars[0].(int)
	case gt:
		return checkvalue.(int) > constraint.vars[0].(int)
	case lt:
		return checkvalue.(int) < constraint.vars[0].(int)
	case bt:
		return checkvalue.(int) > constraint.vars[0].(int) &&
			checkvalue.(int) < constraint.vars[1].(int)
	}

	return false
}
func satisfyBool(action constraintAction, constraint *constraint, checkvalue interface{}) bool {
	switch action {
	case eq:
		return checkvalue.(bool) == constraint.vars[0].(bool)
	}

	return false
}
func (constraint *constraint) getCheckValue(id string, obj objectjson) interface{} {
	return constraint.getvar(id, obj.getJSONOBJ())
}

func (constraint *constraint) check(obj objectjson) bool {
	return constraint.satisfyAction(constraint.action, constraint, constraint.getCheckValue(constraint.on, obj))
}

func createConstraint(jsonobj map[string]interface{}) *constraint {
	constraint := &constraint{}

	constraint.varsnum = int(jsonobj["varsnum"].(float64))
	isparent, baseType, on, parentType := getConstraintType(jsonobj)

	switch baseType {
	case "time":
		constraint.baseType = timevalue
		constraint.getvar = getTime
		constraint.satisfyAction = satisfyTime
		break
	case "string":
		constraint.baseType = stringvalue
		constraint.getvar = getString
		constraint.satisfyAction = satisfyString
		break
	case "int":
		constraint.baseType = intvalue
		constraint.getvar = getInt
		constraint.satisfyAction = satisfyInt
		break
	case "bool":
		constraint.baseType = boolvalue
		constraint.getvar = getBool
		constraint.satisfyAction = satisfyBool
		break
	case "_id":
		constraint.baseType = pointervalue
		constraint.getvar = getString
		constraint.satisfyAction = satisfyString
		break
	default:
		panic(fmt.Errorf("unknow base type %v", baseType))
	}

	constraint.on = on
	constraint.onfull = jsonobj["selectedOn"].(string)

	if isparent {
		switch parentType {
		case "instructor":
			constraint.parentType = instructortype
			break
		case "course":
			constraint.parentType = coursetype
			break
		case "lecture":
			constraint.parentType = lecturetype
			break
		case "room":
			constraint.parentType = roomtype
			break
		default:
			panic(fmt.Errorf("unknow parent type %v", parentType))
		}
	} else {
		constraint.parentType = nonetype
	}

	for i := 0; i < constraint.varsnum; i++ {
		constraint.vars = append(constraint.vars, constraint.getvar(fmt.Sprintf("var%d", i), jsonobj))
	}

	return constraint
}

func (constraints *constraints) add(jsonobj map[string]interface{}) {
	constraint := createConstraint(jsonobj)
	if constraint.onfull == "time" {
		constraints.timeconstraints = append(constraints.constraints, constraint)
	} else {
		constraints.constraints = append(constraints.constraints, constraint)
	}
}

func (constraints *constraints) check(obj objectjson) bool {
	final := true
	checkmap := make(map[string]map[constraintAction]bool)
	for _, constraint := range constraints.constraints {
		result := constraint.check(obj)
		if _, ok := checkmap[constraint.onfull]; !ok {
			checkmap[constraint.onfull] = map[constraintAction]bool{}
		}
		checkmap[constraint.onfull][constraint.action] = checkmap[constraint.onfull][constraint.action] || result
	}

	for _, v := range checkmap {
		for _, v2 := range v {
			final = final && v2
		}
	}

	return final
}

func (state *state) generateConstraints() {
	for _, lecture := range state.lectures {
		constraintsjson := lecture.jsonobj["constraints"].([]interface{})
		lecture.constraints = &constraints{}
		for _, cobj := range constraintsjson {
			jsonobj := cobj.(map[string]interface{})
			lecture.constraints.add(jsonobj)
		}

		if lecture.course.constraints == nil {
			lecture.course.constraints = &constraints{}
			constraintsjson = lecture.coursejsonobj["constraints"].([]interface{})
			for _, cobj := range constraintsjson {
				jsonobj := cobj.(map[string]interface{})
				lecture.course.constraints.add(jsonobj)
				lecture.constraints.add(jsonobj)
			}

		} else {
			for _, c := range lecture.course.constraints.constraints {
				lecture.constraints.constraints = append(lecture.constraints.constraints, c)
			}
			for _, c := range lecture.course.constraints.timeconstraints {
				lecture.constraints.timeconstraints = append(lecture.constraints.timeconstraints, c)
			}
		}
	}
}

//generate -> assign -> reduce

func (state *state) assignmentStage() {
	//assign instructors to lectures
	for _, instructor := range state.instructors {
		for _, courseID := range instructor.teaches {
			found := false
			for _, lec := range state.coursesLectureMap[courseID] {
				if lec.assignedInstructor == nil {
					lec.assignedInstructor = instructor
					instructor.assignedLectures = append(instructor.assignedLectures, lec)
					found = true
					break
				}
			}

			if !found {
				panic(fmt.Errorf("failed to assign instrutor %v to course %v", instructor.name, courseID))
			}
		}
	}

	//assign lectures to rooms
	for _, lecture := range state.lectures {
		for _, room := range state.rooms {
			if lecture.constraints.check(room) {
				lecture.roomCandidates = append(lecture.roomCandidates, room)
			}
		}
	}

}

func (state *state) generateXLSX() {
	f := excelize.NewFile()
	index := f.NewSheet("lectures")
	// Set value of a cell.
	f.SetCellValue("lectures", "A1", "course")
	f.SetCellValue("lectures", "B1", "section")
	f.SetCellValue("lectures", "C1", "instructor")
	f.SetColWidth("lectures", "C", "C", 30)
	f.SetCellValue("lectures", "D1", "room")
	f.SetCellValue("lectures", "E1", "time")
	for i, lecture := range state.lectures {
		f.SetCellValue("lectures", fmt.Sprintf("A%d", i+2), lecture.coursejsonobj["_id"])
		f.SetCellValue("lectures", fmt.Sprintf("B%d", i+2), lecture.jsonobj["section"])
		if lecture.assignedInstructor != nil {
			f.SetCellValue("lectures", fmt.Sprintf("C%d", i+2), lecture.assignedInstructor.name)
		}
		if lecture.assignedRoom != nil {
			f.SetCellValue("lectures", fmt.Sprintf("D%d", i+2), lecture.assignedRoom.jsonobj["_id"])
		}
	}
	// Set active sheet of the workbook.
	f.SetActiveSheet(index)
	// Save xlsx file by the given path.
	err := f.SaveAs("./Book1.xlsx")
	if err != nil {
		fmt.Println(err)
	}
}
