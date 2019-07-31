package main

func main() {
	state := initState()
	state.generateConstraints()
	state.generateCandidates()
	state.solve()
	state.generateXLSX()
}
