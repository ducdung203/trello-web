import Box from '@mui/material/Box'
import ListColumns from '../BoardBar/ListColumns/ListColumns'
import { mapOrder } from '~/utils/sorts'
import {
  DndContext,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'

function BoardContent({ board }) {
  // const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  // Yêu cầu chuột di chuyển 10px mới kích hoạt event
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 10 } })
  //nhấn giữ 250ms và dung sai của cảm ứng mới kích hoạt event
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 500 } })

  // const Sensor = useSensors(pointerSensor)
  const Sensor = useSensors(mouseSensor, touchSensor)

  const [oderedColumns, setOderedColumns] = useState([])

  useEffect(() => {
    setOderedColumns(mapOrder(board?.columns, board?.columnOrderIds, '_id'))
  }, [board])


  const handleDrangEnd = (event) =>{
    console.log('handleDrangEnd', event)
    const { active, over} = event

    if (!over) return

    if (active.id !== over.id) {
      //lấy vị trí cũ(từ active)
      const oldIndex = oderedColumns.findIndex(c => c._id ===active.id)
      //lấy vị trí mới(từ over)
      const newIndex = oderedColumns.findIndex(c => c._id ===over.id)
      const dndOderedColumns = arrayMove (oderedColumns, oldIndex, newIndex)

      setOderedColumns(dndOderedColumns)
    }
  }

  return (
    <DndContext onDragEnd={handleDrangEnd} sensors={Sensor}>
      <Box sx={{
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'),
        width:'100%',
        height: (theme) => theme.trello.boardContentHeight,
        p:'10px 0'
      }}>
        <ListColumns columns={oderedColumns}/>
      </Box>
    </DndContext>
  )
}

export default BoardContent
