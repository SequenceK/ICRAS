package main

import (
	"fmt"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/net/websocket"
)

func main() {
	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.Static("/", "dist")
	e.File("/", "dist/index.html")

	InitDBService(e)
	e.GET("/icras/build", apibuild)
	e.GET("/icras/timetable.xlsx", apisolve)

	e.Logger.Fatal(e.Start(":62028"))
}

func apibuild(c echo.Context) error {
	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()
		for {
			state := initState()
			state.generateConstraints()
			state.generateCandidates()
			state.solve()
			f := state.generateXLSX()
			b, err := f.WriteToBuffer()
			if err != nil {
				panic(err)
			}

			err = websocket.Message.Send(ws, b.Bytes())
			if err != nil {
				c.Logger().Error(err)
			}

			// Read
			msg := ""
			err = websocket.Message.Receive(ws, &msg)
			if err != nil {
				c.Logger().Error(err)
			}
			fmt.Printf("%s\n", msg)
		}
	}).ServeHTTP(c.Response(), c.Request())
	return nil
}

func apisolve(c echo.Context) error {

	state := initState()
	state.generateConstraints()
	state.generateCandidates()
	state.solve()
	f := state.generateXLSX()
	b, err := f.WriteToBuffer()
	if err != nil {
		panic(err)
	}

	return c.Blob(200, echo.MIMETextPlainCharsetUTF8, b.Bytes())
}
