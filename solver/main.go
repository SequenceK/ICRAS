package main

func main() {
	state := initState("Engineering")
	state.generateConstraints()
	state.generateCandidates()
	state.solve()
	state.generateXLSX()
}
