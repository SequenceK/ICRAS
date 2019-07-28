package main

func main() {
	state := initState()
	state.generateConstraints()
	state.assignmentStage()
	state.generateXLSX()
}
