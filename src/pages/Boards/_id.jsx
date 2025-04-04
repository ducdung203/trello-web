import Container from '@mui/material/Container'
import AppBar from '~/components/AppBar/AppBar'
import BoardBar from './BoardBar/BoardBar'
import BoardContent from './BoardContent/BoardContent'
// import { mockData } from '~/apis/mock-data'
import { useEffect, useState } from 'react'
import { fetchBoardDetailsAPI, createNewColumnAPI, createNewCardAPI, updateBoardDetailsAPI, updateColumnDetailsAPI, moveCardToDifferentColumnAPI } from '~/apis'
import { generatePlaceholderCard } from '~/utils/formatters'
import { isEmpty } from 'lodash'
import { mapOrder } from '~/utils/sorts'
import { Box, Typography } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'


function Board() {
  const [board, setBoard] = useState(null)

  useEffect(() => {
    //Tạm thời fix cứng boardId , sau dùng react-router-dom
    const boardId = '67db94197d1b99cc2fa47934'
    //call API
    fetchBoardDetailsAPI(boardId).then((board) => {
      // sắp xếp lại thứ tự các column trong board theo thứ tự id của nó
      board.columns = mapOrder(board.columns, board.columnOrderIds, '_id')
      //cần xử lí vấn đề kéo thả vào 1 column rỗng
      board.columns.forEach((column) => {
        //khi f5 trang  thì cần xử lí vấn đề kéo thả vào 1 column rỗng
        if (isEmpty(column.cards)) {
          column.cards=[generatePlaceholderCard(column)]
          column.cardOrderIds=[generatePlaceholderCard(column)._id]
        } else {
          //sắp xếp lại thứ tự các card trong column theo thứ tự id của nó
          column.cards = mapOrder(column.cards, column.cardOrderIds, '_id')
        }
      })
      setBoard(board)
    })
  }, [])

  //Function có nhiệm vụ gọi API tạo mới column và cập nhật lại state board
  const createNewColumn = async (newColumnData) => {
    const createdColumn = await createNewColumnAPI({
      ...newColumnData,
      boardId: board._id
    })

    //khi tạo mới column thì sẽ tạo luôn 1 card rỗng trong column đó
    createdColumn.column = generatePlaceholderCard(createdColumn)
    createdColumn.cardOrderIds = [generatePlaceholderCard(createdColumn)._id]

    //Cập nhật lại state board với column mới được tạo
    const newBoard = { ...board }
    newBoard.columns.push(createdColumn)
    newBoard.columnOrderIds.push(createdColumn._id)
    setBoard(newBoard)
  }

  //Function có nhiệm vụ gọi API tạo mới card và cập nhật lại state board
  const createNewCard = async (newCardData) => {
    const createdCard = await createNewCardAPI({
      ...newCardData,
      boardId: board._id
    })

    //Cập nhật lại state board với column mới được tạo
    const newBoard = { ...board }
    const columnToUpdate = newBoard.columns.find(column => column._id === createdCard.columnId)
    if (columnToUpdate) {
      columnToUpdate.cards.push(createdCard)
      columnToUpdate.cardOrderIds.push(createdCard._id)
    }
    setBoard(newBoard)
  }

  //Function có nhiệm vụ gọi API tạo mới card và xử lí khi kéo thả xong xuôi
  //- chỉ cần gọi API cập nhật lại mảng columnOrderIds của board chứa nó
  const moveColumns = (dndOderedColumns) => {
    const dndOrderedColumnIds = dndOderedColumns.map(column => column._id)
    const newBoard = { ...board }
    newBoard.columns = dndOderedColumns
    newBoard.columnOrderIds = dndOrderedColumnIds
    setBoard(newBoard)

    //Gọi API cập nhật lại thứ tự các column trong board
    updateBoardDetailsAPI(board._id, {
      columnOrderIds: dndOrderedColumnIds
    })
  }

  //khi di chuyển card trong 1 column:
  //- chỉ cần gọi API cập nhật lại mảng cardOrderIds của column chứa nó
  const moveCardInTheSameColumn = (dndOderedCards, dndOderedCardsIds, columnId) => {
  //update cho chuẩn dữ liệu state board

    const newBoard = { ...board }
    const columnToUpdate = newBoard.columns.find(column => column._id === columnId)
    if (columnToUpdate) {
      columnToUpdate.cards = dndOderedCards
      columnToUpdate.cardOrderIds = dndOderedCardsIds
    }
    setBoard(newBoard)

    //Gọi API cập nhật lại thứ tự các card trong column
    updateColumnDetailsAPI(columnId, {
      cardOrderIds: dndOderedCardsIds
    })
  }

  //khi di chuyển card từ column này sang column khác:
  //b1: cập nhật mảng cardOrderIds của column ban đầu chứa nó(hiểu bản chất là xóa cái _id của card đó trong mảng cardOrderIds của column ban đầu)
  //b2: cập nhật mảng cardOrderIds của column mới chứa nó(hiểu bản chất là thêm cái _id của card đó vào mảng cardOrderIds của column mới)
  //b3: cập nhật lại trường columnId mới của cái card đã kéo
  //=>làm 1 API support riêng
  const moveCardToDifferentColumn = (currentCardId, prevColumnId, nextColumnId, dndOderedColumns) => {
    const dndOrderedColumnIds = dndOderedColumns.map(column => column._id)
    const newBoard = { ...board }
    newBoard.columns = dndOderedColumns
    newBoard.columnOrderIds = dndOrderedColumnIds
    setBoard(newBoard)

    //Gọi API cập nhật lại
    let prevCardOrderIds = dndOderedColumns.find(column => column._id === prevColumnId).cardOrderIds
    //xử lí vấn đề khi kéo card cuối cùng trong column
    if (prevCardOrderIds.length === 1) {
      prevCardOrderIds = []
    }
    moveCardToDifferentColumnAPI({
      currentCardId,
      prevColumnId,
      prevCardOrderIds,
      nextColumnId,
      nextCardOrderIds: dndOderedColumns.find(column => column._id === nextColumnId)?.cardOrderIds
    })

  }

  if (!board)
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        height: '100vh',
        width: '100vw'
      }}>
        <CircularProgress />
        <Typography>Loading Board...</Typography>
      </Box>
    )
  return (
    <Container disableGutters maxWidth={false} sx={{ height: '100vh' }}>
      <AppBar/>
      <BoardBar board={board}/>
      <BoardContent
        board={board}
        createNewColumn={createNewColumn}
        createNewCard={createNewCard}
        moveColumns={moveColumns}
        moveCardInTheSameColumn={moveCardInTheSameColumn}
        moveCardToDifferentColumn={moveCardToDifferentColumn}
      />
    </Container>
  )
}

export default Board
