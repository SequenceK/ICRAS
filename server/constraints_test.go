package main

import "testing"

func TestSatisfyTime(t *testing.T) {
	var time mtime
	time = toTime("9:00")
	action := eq
	c := &constraint{}
	c.vars = []constraintVariable{time}
	checkvalue := mtime(time)

	got := satisfyTime(action, c, checkvalue)
	if !got {
		t.Errorf("satisfyTime failed")
	}
}
