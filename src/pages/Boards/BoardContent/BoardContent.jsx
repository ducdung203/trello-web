import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'
import { mapOrder } from '~/utils/sorts'
import {
  DndContext,
  // PointerSensor,
  // MouseSensor,
  // TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  closestCorners,
  pointerWithin,
  // rectIntersection,
  getFirstCollision
  // closestCenter
} from '@dnd-kit/core'
import { MouseSensor, TouchSensor } from '~/customLibraries/DndKitSensors'
import { useCallback, useEffect, useRef, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import Card from './ListColumns/Column/ListCards/Card/Card'
import Column from './ListColumns/Column/Column'
import { cloneDeep, isEmpty } from 'lodash'
import { generatePlaceholderCard } from '~/utils/formatters'

const ACTIVE_DRAG_ITEM_TYPE ={
  COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
  CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD'
}

function BoardContent({ board }) {
  // const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  // Yêu cầu chuột di chuyển 10px mới kích hoạt event
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 10 } })
  //nhấn giữ 250ms và dung sai của cảm ứng mới kích hoạt event
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 500 } })

  // const Sensor = useSensors(pointerSensor)
  const Sensor = useSensors(mouseSensor, touchSensor)

  const [oderedColumns, setOderedColumns] = useState([])
  //cùng 1 thời điểm chỉ có 1 phần tử đc kéo
  const [activeDragItemId, setActiveDragItemId] = useState(null)
  const [activeDragItemType, setActiveDragItemType] = useState(null)
  const [activeDragItemData, setActiveDragItemData] = useState(null)
  const [oldColumnWhenDraggingCard, setOldColumnWhenDraggingCard] = useState(null)
  //điểm va chạm cuối cùng trước đó
  const lastOverId = useRef(null)

  useEffect(() => {
    setOderedColumns(mapOrder(board?.columns, board?.columnOrderIds, '_id'))
  }, [board])

  //tìm 1 column theo cardId
  const findColumnByCardId = (cardId) => {
    //Đoạn này cần lưu ý, nên dùng
    return oderedColumns.find(column => column?.cards?.map( card => card._id )?.includes(cardId))
  }

  const moveCardBetweenDifferentColumns = (
    overColumn,
    overCardId,
    active,
    over,
    activeColumn,
    activeDraggingCardId,
    activeDraggingCardData
  ) => {
    setOderedColumns(prevColumns => {
      //tìm vị trí (index) của cái overCard trong column đích (nơi mà activeCard sắp được thả)
      const overCardIndex = overColumn?.cards?.findIndex(card => card._id ===overCardId)

      //Logic tính toán "cardIndex mới" (trên hoặc dưới của overCard) lấy chuẩn ra từ code của thư viện
      let newCardIndex
      const isBelowOverItem =active.rect.current.translated &&
      active.rect.current.translated.top > over.rect.top + over.rect.height

      const modifier = isBelowOverItem ? 1 : 0

      newCardIndex = overCardIndex >= 0 ? overCardIndex + modifier : overColumn?.cards?.length + 1

      //Clone mảng OderedColumnsState cũ ra 1 cái mới để xử lí data rồi return - câp nhật lại OderedColumnsState mới
      const nextColumns = cloneDeep(prevColumns)
      const nextActiveColumn = nextColumns.find(column => column._id === activeColumn._id)
      const nextOverColumn = nextColumns.find(column => column._id === overColumn._id)

      //Column cũ
      if (nextActiveColumn) {
        //Xóa card ở cái column active
        nextActiveColumn.cards = nextActiveColumn.cards.filter(card => card._id !== activeDraggingCardId)

        //thêm placeholder card nếu column rỗng, (bị kéo hết card đi)
        if (isEmpty(nextActiveColumn.cards)) {
          nextActiveColumn.cards = [generatePlaceholderCard(nextActiveColumn)]
        }

        //cập nhật lại mảng cardOrderIds
        nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(card => card._id)
        // console.log("'dũng'")
      }
      //Column mới
      if (nextOverColumn) {
        //Kiểm tra xem card đang kéo nó có tồn tại overColumn chưa, nếu có thì cần xóa nó trước
        nextOverColumn.cards = nextOverColumn.cards.filter(card => card._id !== activeDraggingCardId)

        //phải cập nhật lại chuẩn dữ liệu columnId trong card sau khi kéo thả giữa 2 column khác nhau
        const rebuild_activeDraggingCardData = {
          ...activeDraggingCardData,
          columnId: nextOverColumn._id
        }
        //tiếp theo là thêm cái card đang kéo vào overColumn theo vị trí index mới
        nextOverColumn.cards = nextOverColumn.cards.toSpliced(newCardIndex, 0, rebuild_activeDraggingCardData)

        //xóa placeholder card neus nó tồm tại
        nextOverColumn.cards = nextOverColumn.cards.filter(card => !card.FE_placeholderCard)

        //cập nhật lại mảng cardOrderIds
        nextOverColumn.cardOrderIds = nextOverColumn.cards.map(card => card._id)
      }
      return nextColumns
    })
  }
  //Trigger khi bắt đầu kéo
  const handleDragStart = (event) => {
    setActiveDragItemId(event?.active?.id)
    setActiveDragItemType(event?.active?.data?.current?.columnId ? ACTIVE_DRAG_ITEM_TYPE.CARD : ACTIVE_DRAG_ITEM_TYPE.COLUMN)
    setActiveDragItemData(event?.active?.data?.current)

    //nếu kéo card mới set oldColumn
    if (event?.active?.data?.current?.columnId) {
      setOldColumnWhenDraggingCard(findColumnByCardId(event?.active?.id))
    }
  }

  const handleDragOver = (event) => {
    //khong làm gi thêm nếu kéo column
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return

    //còn nếu là card thì xử lí thêm để kéo qua lại các column
    // console.log('handleDragOver', event)
    const { active, over } = event
    if (!active||!over) return

    const { id: activeDraggingCardId, data : { current: activeDraggingCardData } } = active
    const { id: overCardId } = over

    //tìm 2 column theo cardId
    const activeColumn = findColumnByCardId(activeDraggingCardId)
    const overColumn = findColumnByCardId(overCardId)

    //nếu k tồn tại 1 trong 2 column thì thoát
    if (!activeColumn || !overColumn) return

    //xử lí logic ở đây chỉ khi kéo card qua 2 column khác nhau, con nếu kéo trong 1 column thì k làm j
    //đây là xử lí lúc kéo(handleDragOver)
    if ( activeColumn._id !== overColumn._id ) {
      moveCardBetweenDifferentColumns(
        overColumn,
        overCardId,
        active,
        over,
        activeColumn,
        activeDraggingCardId,
        activeDraggingCardData
      )
    }
  }

  //Trigger khi kết thúc thả
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (!active||!over) return

    //xử lí kéo thả column
    if (activeDragItemType===ACTIVE_DRAG_ITEM_TYPE.CARD) {

      const { id: activeDraggingCardId, data : { current: activeDraggingCardData } } = active
      const { id: overCardId } = over

      //tìm 2 column theo cardId
      const activeColumn = findColumnByCardId(activeDraggingCardId)
      const overColumn = findColumnByCardId(overCardId)

      //nếu k tồn tại 1 trong 2 column thì thoát
      if (!activeColumn || !overColumn) return

      if ( oldColumnWhenDraggingCard._id !== overColumn._id ) {
        moveCardBetweenDifferentColumns(
          overColumn,
          overCardId,
          active,
          over,
          activeColumn,
          activeDraggingCardId,
          activeDraggingCardData
        )
      } else {
        //Hành động kéo thả trong 1 column
        //lấy vị trí cũ(từ oldColumnWhenDraggingCard)
        const oldCardIndex = oldColumnWhenDraggingCard?.cards?.findIndex(c => c._id ===activeDragItemId)
        //lấy vị trí mới(từ over)
        const newCardIndex = overColumn?.cards?.findIndex(c => c._id ===overCardId)

        const dndOderedCards = arrayMove (oldColumnWhenDraggingCard?.cards, oldCardIndex, newCardIndex)

        setOderedColumns(prevColumns => {
          const nextColumns = cloneDeep(prevColumns)
          //Tìm tới column đang thả
          const targetColumn = nextColumns.find(column => column._id === overColumn._id )

          //cập nhật lại 2 giá trị mới là card và cardOrderIds trong targetColumn
          targetColumn.cards = dndOderedCards
          targetColumn.cardOrderIds = dndOderedCards.map(card => card._id)

          return nextColumns
        }
        )
      }


    }
    //xử lí kéo thả column trong boardContent
    if (activeDragItemType===ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      if (active.id !== over.id) {
        //lấy vị trí cũ(từ active)
        const oldColumnIndex = oderedColumns.findIndex(c => c._id ===active.id)
        //lấy vị trí mới(từ over)
        const newColumnIndex = oderedColumns.findIndex(c => c._id ===over.id)
        // dùng arrayMonve dndkit để sắp xếp lại mảng column ban đầu
        const dndOderedColumns = arrayMove (oderedColumns, oldColumnIndex, newColumnIndex)

        setOderedColumns(dndOderedColumns)
      }
    }

    //những giữ liệu sau khi kéo thả đưa về dữ liệu null
    setActiveDragItemId(null)
    setActiveDragItemType(null)
    setActiveDragItemData(null)
    setOldColumnWhenDraggingCard(null)
  }

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5'
        }
      }
    })
  }
  //args = các đối số, tham số
  const collisionDetectionStrategy = useCallback((args) => {
    //trường hợp kéo column thì dùng closestCorners
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      return closestCorners({ ...args })
    }
    //tìm các điểm giao nhau, va chạm với con trỏ
    const poiterIntersections = pointerWithin(args)

    if (!poiterIntersections?.length) return
    // const intersections = !!poiterIntersections?.length
    //   ? poiterIntersections
    //   : rectIntersection(args)

    //tìm overId đầu tiên trong intersections
    let overId = getFirstCollision(poiterIntersections, 'id')

    if (overId) {

      const checkColumn = oderedColumns.find(column => column._id === overId)
      if (checkColumn) {
        overId = closestCorners({
          ...args,
          droppableContainers: args.droppableContainers.filter(container => {
            return (container.id !== overId) &&
              (checkColumn?.cardOrderIds?.includes(container.id))
          })
        })[0]?.id
      }
      lastOverId.current = overId
      return [{ id: overId }]
    }
    //nếu overId là null thì trả về mảng rỗng
    return lastOverId.current ? [{ id: lastOverId.current }]:[]
  }, [activeDragItemType, oderedColumns])

  return (
    <DndContext
      //nếu chỉ dùng closestCorners sẽ có bug sai lệch dữ liệu
      // collisionDetection={closestCorners}
      //tự custom thuật toán phát hiện va chạm
      collisionDetection={collisionDetectionStrategy}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      sensors={Sensor}>
      <Box sx={{
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'),
        width:'100%',
        height: (theme) => theme.trello.boardContentHeight,
        p:'10px 0'
      }}>
        <ListColumns columns={oderedColumns}/>
        <DragOverlay dropAnimation={dropAnimation}>
          {!activeDragItemType&& null}
          {(activeDragItemType ===ACTIVE_DRAG_ITEM_TYPE.COLUMN) && <Column column={activeDragItemData}/> }
          {(activeDragItemType ===ACTIVE_DRAG_ITEM_TYPE.CARD) && <Card card={activeDragItemData}/> }
        </DragOverlay>
      </Box>
    </DndContext>
  )
}

export default BoardContent
