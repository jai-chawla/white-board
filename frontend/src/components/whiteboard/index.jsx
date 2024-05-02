import { useEffect, useState, useLayoutEffect } from "react";
import rough from "roughjs";

const roughGenerator = rough.generator()

const WhiteBoard = ({ canvasRef, ctxRef, elements, setElements, color, tool, user, socket, users }) => {
  const [img, setImg] = useState(null);

  useEffect(() => {
    socket.on("whiteboardDataResponse", (data) => {
      setImg(data.imgURL);
    })
  }, []);

  if (!user?.presenter) {
    return (
      <div className="border border-dark border-3 h-100 w-100 overflow-hidden" >

        {img?(<img src={img} style={{ height: window.innerHeight * 2,width: "285%"}}/>):(<h1 className=" text-center pt-4 py-4">The meeting presenter will draw here, Please Wait....</h1>)}

      </div>
    )
  }
  const [isDrawing, setIsDrawing] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.height = window.innerHeight * 2;
    canvas.width = window.innerWidth * 2;
    const ctx = canvas.getContext("2d");

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    ctxRef.current = ctx;
  }, []); // Add canvasRef and ctxRef to the dependency array

  useEffect(() => {
    ctxRef.current.strokeStyle = color;

  }, [color]);
  useLayoutEffect(() => {
    if (canvasRef) {
      const roughCanvas = rough.canvas(canvasRef.current);
      if (elements.length > 0) {
        ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      elements.forEach(element => {
        if (element.type === 'rect') {
          roughCanvas.draw(
            roughGenerator.rectangle(
              element.offsetX,
              element.offsetY,
              element.width,
              element.height,
              {
                stroke: element.stroke,
                strokeWidth: 5,
                roughness: 0
              }

            )

          )

        }
        else if (element.type === "line") {
          roughCanvas.draw(
            roughGenerator.line(element.offsetX, element.offsetY, element.width, element.height,
              {
                stroke: element.stroke,
                strokeWidth: 5,
                roughness: 0
              }
            ));
        } else if (element.type === "pencil") {
          roughCanvas.linearPath(element.path,
            {
              stroke: element.stroke,
              strokeWidth: 5,
              roughness: 0
            }
          );

        }
      });
      const canvasImage = canvasRef.current.toDataURL();
      socket.emit("whiteboardData", canvasImage);

    }

  }, [elements])

  const handleMouseDown = (e) => {
    // const rect = e.target.getBoundingClientRect();
    // const offsetX = e.clientX - rect.left;
    // const offsetY = e.clientY - rect.top;
    // console.log(offsetX, offsetY);

    const { offsetX, offsetY } = e.nativeEvent;

    if (tool === "pencil") {
      setElements((preElements) => [
        ...preElements,
        {
          type: "pencil",
          offsetX,
          offsetY,
          path: [[offsetX, offsetY]],
          stroke: color,

        }
      ]);
    } else if (tool === "line") {
      setElements((prevElements) => [
        ...prevElements,
        {
          type: "line",
          offsetX,
          offsetY,
          width: offsetX,
          height: offsetY,
          stroke: color,
        }
      ])
    } else if (tool === "rect") {
      setElements((prevElements) => [
        ...prevElements,
        {
          type: "rect",
          offsetX,
          offsetY,
          width: 0,
          height: 0,
          stroke: color,

        }

      ])
    }

    setIsDrawing(true);
  }
  const handleMouseMove = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    if (isDrawing) {
      if (tool == "pencil") {
        const { path } = elements[elements.length - 1];
        const newPath = [...path, [offsetX, offsetY]];
        setElements((prevElements) =>
          prevElements.map((ele, index) => {
            if (index === elements.length - 1) {
              return {
                ...ele,
                path: newPath,
              }
            } else {
              return ele;
            }

          })
        );
      } else if (tool === "line") {
        setElements((prevElements) =>
          prevElements.map((ele, index) => {
            if (index === elements.length - 1) {
              return {
                ...ele,
                width: offsetX,
                height: offsetY,
              };
            } else {
              return ele;
            }
          })
        )
      } else if (tool === "rect") {
        setElements((prevElements) =>
          prevElements.map((ele, index) => {
            if (index === elements.length - 1) {
              return {
                ...ele,
                width: offsetX - ele.offsetX,
                height: offsetY - ele.offsetY,
              };
            } else {
              return ele;
            }
          })
        )
      }

    }
  };
  const handleMouseUp = (e) => {
    setIsDrawing(false);
  }


  return (

    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="border border-dark border-3 h-100 w-100 overflow-hidden"
    >
      <canvas
        ref={canvasRef} // Add ref attribute to the canvas element
      />

    </div>
  );
};

export default WhiteBoard;
