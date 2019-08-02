package main

import (
	"fmt"
	"strings"
	"time"
)

type objectjson interface {
	getJSONOBJ() map[string]interface{}
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

func getConstraintType(jsonobj map[string]interface{}) (bool, string, string, string) {
	selectedOn := jsonobj["selectedOn"].(string)
	ids := strings.Split(selectedOn, ".")
	len := len(ids)
	if len >= 2 {
		return true, jsonobj["type"].(string), ids[len-1], ids[len-2]
	}

	return false, jsonobj["type"].(string), ids[len-1], ""
}

func toTime(value string) mtime {
	baset, _ := time.Parse("15:04", "00:00")
	t, _ := time.Parse("15:04", value)
	return mtime(t.Sub(baset).Minutes())
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
		return checkvalue.(mtime) == constraint.vars[0].(mtime)
	case gt:
		return checkvalue.(mtime) > constraint.vars[0].(mtime)
	case lt:
		return checkvalue.(mtime) < constraint.vars[0].(mtime)
	case bt:
		return checkvalue.(mtime) > constraint.vars[0].(mtime) &&
			checkvalue.(mtime) < constraint.vars[1].(mtime)
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

func (constraint *constraint) checkTimeslot(timeslot *timeslot) bool {
	return constraint.satisfyAction(constraint.action, constraint, timeslot.data.time)
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

func (constraints *constraints) checkTimeslot(timeslot *timeslot) bool {
	final := true
	checkmap := make(map[string]map[constraintAction]bool)
	for _, constraint := range constraints.timeconstraints {
		result := constraint.checkTimeslot(timeslot)
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
		constraintsjson, ok := lecture.jsonobj["constraints"].([]interface{})

		lecture.constraints = &constraints{}
		if ok {
			for _, cobj := range constraintsjson {
				jsonobj := cobj.(map[string]interface{})
				lecture.constraints.add(jsonobj)
			}
		}

		if lecture.course.constraints == nil {
			lecture.course.constraints = &constraints{}
			constraintsjson, ok := lecture.coursejsonobj["constraints"].([]interface{})
			if ok {
				for _, cobj := range constraintsjson {
					jsonobj := cobj.(map[string]interface{})
					lecture.course.constraints.add(jsonobj)
					lecture.constraints.add(jsonobj)
				}
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
