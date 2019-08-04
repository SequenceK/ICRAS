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

	e.Logger.Fatal(e.Start(":62028"))
}

func wsrecover(ws *websocket.Conn) {

	if r := recover(); r != nil {
		websocket.Message.Send(ws, "error<br>")
		websocket.Message.Send(ws, r)
	}
}

func apibuild(c echo.Context) error {
	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()
		defer func() {

			if r := recover(); r != nil {
				websocket.Message.Send(ws, fmt.Sprintf("<font color=\"red\">error: %v</font><br>", r))
			}
		}()

		// Read
		msg := ""
		err := websocket.Message.Receive(ws, &msg)
		if err != nil {
			c.Logger().Error(err)
		}

		websocket.Message.Send(ws, "Initializing<br>")
		state := initState(ws)
		websocket.Message.Send(ws, "Generating Constraints<br>")
		state.generateConstraints()
		websocket.Message.Send(ws, "Generating Candidates<br>")
		state.generateCandidates()
		websocket.Message.Send(ws, "Solving System<br>")
		state.solve()
		websocket.Message.Send(ws, "Creating XLSX file<br>")
		state.generateXLSX()
		websocket.Message.Send(ws, "Done<br>")
	}).ServeHTTP(c.Response(), c.Request())
	return nil
}
