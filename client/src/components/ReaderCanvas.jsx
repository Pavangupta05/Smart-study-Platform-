import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Path, Transformer } from 'react-konva';
import { getStroke } from 'perfect-freehand';

// Utility to convert perfect-freehand stroke to SVG path
function getSvgPathFromStroke(stroke) {
  if (!stroke.length) return '';
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );
  d.push('Z');
  return d.join(' ');
}

const penOptions = {
  fountain: { size: 4, thinning: 0.5, smoothing: 0.5, streamline: 0.5 },
  marker: { size: 12, thinning: -0.4, smoothing: 0.8, streamline: 0.5 },
  pencil: { size: 2, thinning: 0, smoothing: 0.2, streamline: 0.5 },
  highlighter: { size: 18, thinning: 0, smoothing: 0.8, streamline: 0.5 }
};

export default function ReaderCanvas({
  pageIdx,
  width = 800,
  height = 1130,
  activeTool,
  penStyle,
  penColor,
  strokeWidth,
  elements,
  setElements,
  onSave
}) {
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const trRef = useRef(null);
  const isDrawing = useRef(false);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // Clear selection if tool changes from lasso
  useEffect(() => {
    if (activeTool !== 'lasso') {
      setSelectedId(null);
    }
  }, [activeTool]);

  // Update Transformer when selection changes
  useEffect(() => {
    if (activeTool === 'lasso' && selectedId) {
      const node = layerRef.current.findOne(`#stroke-${selectedId}`);
      if (node && trRef.current) {
        trRef.current.nodes([node]);
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId, activeTool, elements]);

  const getPointerPos = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    return stage.getPointerPosition();
  };

  const handlePointerDown = (e) => {
    if (activeTool === 'lasso') {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setSelectedId(null);
      }
      return;
    }

    if (!['pen', 'highlighter', 'eraser'].includes(activeTool)) return;
    if (e.evt.touches && e.evt.touches.length > 1) return;

    isDrawing.current = true;
    const pos = getPointerPos();
    if (!pos) return;

    const newStroke = {
      id: Date.now().toString(),
      type: 'stroke',
      tool: activeTool,
      style: activeTool === 'highlighter' ? 'highlighter' : penStyle,
      color: penColor,
      width: strokeWidth,
      points: [[pos.x, pos.y, e.evt.pressure || 0.5]],
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1
    };

    setCurrentStroke(newStroke);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing.current || !currentStroke) return;
    if (e.evt.touches && e.evt.touches.length > 1) {
      isDrawing.current = false;
      setCurrentStroke(null);
      return;
    }

    const pos = getPointerPos();
    if (!pos) return;

    setCurrentStroke((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, [pos.x, pos.y, e.evt.pressure || 0.5]]
      };
    });
  };

  const handlePointerUp = () => {
    if (!isDrawing.current || !currentStroke) return;
    isDrawing.current = false;
    
    if (currentStroke.points.length > 2) {
      const updatedElements = [...(elements || []), currentStroke];
      setElements(updatedElements);
      onSave(updatedElements);
    }
    
    setCurrentStroke(null);
  };

  const handlePathClick = (e, elementId) => {
    if (activeTool === 'eraser') {
      const updatedElements = (elements || []).filter(el => el.id !== elementId);
      setElements(updatedElements);
      onSave(updatedElements);
    } else if (activeTool === 'lasso') {
      setSelectedId(elementId);
    }
  };

  const handleTransformEnd = (e, elementId) => {
    const node = e.target;
    const updatedElements = (elements || []).map((el) => {
      if (el.id === elementId) {
        return {
          ...el,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
        };
      }
      return el;
    });
    setElements(updatedElements);
    onSave(updatedElements);
  };

  const handleDragEnd = (e, elementId) => {
    const node = e.target;
    const updatedElements = (elements || []).map((el) => {
      if (el.id === elementId) {
        return {
          ...el,
          x: node.x(),
          y: node.y(),
        };
      }
      return el;
    });
    setElements(updatedElements);
    onSave(updatedElements);
  };

  const renderStroke = (strokeObj) => {
    const isHighlighter = strokeObj.style === 'highlighter';
    const opts = penOptions[strokeObj.style] || penOptions.fountain;
    const currentOptions = { ...opts, size: opts.size * (strokeObj.width / 3) };
    
    const strokeOutline = getStroke(strokeObj.points, currentOptions);
    const pathData = getSvgPathFromStroke(strokeOutline);

    const isSelected = selectedId === strokeObj.id && activeTool === 'lasso';

    return (
      <Path
        key={strokeObj.id}
        id={`stroke-${strokeObj.id}`}
        data={pathData}
        fill={strokeObj.color}
        opacity={isHighlighter ? 0.4 : 1}
        globalCompositeOperation={isHighlighter ? 'multiply' : 'source-over'}
        onPointerDown={(e) => handlePathClick(e, strokeObj.id)}
        draggable={isSelected}
        x={strokeObj.x || 0}
        y={strokeObj.y || 0}
        scaleX={strokeObj.scaleX || 1}
        scaleY={strokeObj.scaleY || 1}
        rotation={strokeObj.rotation || 0}
        onDragEnd={(e) => handleDragEnd(e, strokeObj.id)}
        onTransformEnd={(e) => handleTransformEnd(e, strokeObj.id)}
        perfectDrawEnabled={false}
      />
    );
  };

  const isToolActive = ['pen', 'highlighter', 'eraser', 'lasso'].includes(activeTool);

  return (
    <div 
      className="reader-canvas-container" 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%',
        height: '100%',
        zIndex: 5,
        pointerEvents: isToolActive ? 'auto' : 'none',
        touchAction: 'none'
      }}
    >
      <Stage
        width={width}
        height={height}
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <Layer ref={layerRef}>
          {elements && elements.map((el) => {
            if (el.type === 'stroke') return renderStroke(el);
            return null;
          })}

          {currentStroke && renderStroke(currentStroke)}
          
          {activeTool === 'lasso' && selectedId && (
            <Transformer
              ref={trRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
