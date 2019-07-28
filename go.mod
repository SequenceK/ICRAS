module ICRAS

go 1.12

replace (
	ICRAS/build => ./build
	ICRAS/server => ./server
	ICRAS/solver => ./solver
)

require (
	ICRAS/build v0.0.0-00010101000000-000000000000 // indirect
	ICRAS/server v0.0.0-00010101000000-000000000000 // indirect
	ICRAS/solver v0.0.0-00010101000000-000000000000 // indirect
	golang.org/x/image v0.0.0-20190703141733-d6a02ce849c9 // indirect
)
