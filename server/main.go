package main

import (
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

func apibuild(c echo.Context) error {
	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()

		// Read
		msg := ""
		err := websocket.Message.Receive(ws, &msg)
		if err != nil {
			c.Logger().Error(err)
		}

		websocket.Message.Send(ws, "Initializing "+msg)
		state := initState(msg)
		websocket.Message.Send(ws, "Generating Constraints")
		state.generateConstraints()
		websocket.Message.Send(ws, "Generating Candidates")
		state.generateCandidates()
		websocket.Message.Send(ws, "Solving System")
		state.solve()
		websocket.Message.Send(ws, "Creating XLSX file")
		f := state.generateXLSX()
		websocket.Message.Send(ws, "Done")
		b, err := f.WriteToBuffer()
		if err != nil {
			panic(err)
		}

		err = websocket.Message.Send(ws, b.Bytes())
		if err != nil {
			c.Logger().Error(err)
		}
	}).ServeHTTP(c.Response(), c.Request())
	return nil
}
