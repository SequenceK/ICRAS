package main

type department struct {
	jsonobj     map[string]interface{}
	instructors map[string]bool
	courses     map[string]bool
	rooms       map[string]bool
}

func (dep *department) init(obj map[string]interface{}) {
	dep.jsonobj = obj
	dep.instructors = map[string]bool{}
	dep.courses = map[string]bool{}
	dep.rooms = map[string]bool{}
	dbs, ok := obj["db"].(map[string]interface{})

	if ok {
		inst, ok := dbs["instructors"].([]interface{})
		if ok {
			for _, obj := range inst {
				dep.instructors[obj.(string)] = true
			}
		}
		courses, ok := dbs["courses"].([]interface{})
		if ok {
			for _, obj := range courses {
				dep.courses[obj.(string)] = true
			}
		}
		rooms, ok := dbs["rooms"].([]interface{})
		if ok {
			for _, obj := range rooms {
				dep.rooms[obj.(string)] = true
			}
		}
	}
}

func (dep *department) containsInstructor(id string) bool {
	c, ok := dep.instructors[id]
	return ok && c
}
func (dep *department) containsCourse(id string) bool {
	c, ok := dep.courses[id]
	return ok && c
}
func (dep *department) containsRoom(id string) bool {
	c, ok := dep.rooms[id]
	return ok && c
}
