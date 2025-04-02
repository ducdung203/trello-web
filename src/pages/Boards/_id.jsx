import Container from '@mui/material/Container'
import AppBar from '~/components/AppBar/AppBar'
import BoardBar from './BoardBar/BoardBar'
import BoardContent from './BoardContent/BoardContent'
import { mockData } from '~/apis/mock-data'
import { useEffect, useState } from 'react'
import { fetchBoardDetailsAPI, createNewColumnAPI, createNewCardAPI, updateBoardDetailsAPI } from '~/apis'
import { generatePlaceholderCard } from '~/utils/formatters'
import { isEmpty } from 'lodash'

function Board() {
  const [board, setBoard] = useState(null)

  useEffect(() => {
    //Tạm thời fix cứng boardId , sau dùng react-router-dom
    const boardId = '67db94197d1b99cc2fa47934'
    //call API
    fetchBoardDetailsAPI(boardId).then((board) => {
      //cần xử lí vấn đề kéo thả vào 1 column rỗng
      board.columns.forEach((column) => {
        if (isEmpty(column.cards)) {
          column.cards=[generatePlaceholderCard(column)]
          column.cardOrderIds=[generatePlaceholderCard(column)._id]
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
  const moveColumns = async (dndOderedColumns) => {
    const dndOrderedColumnIds = dndOderedColumns.map(column => column._id)
    const newBoard = { ...board }
    newBoard.columns = dndOderedColumns
    newBoard.columnOrderIds = dndOrderedColumnIds
    setBoard(newBoard)

    //Gọi API cập nhật lại thứ tự các column trong board
    await updateBoardDetailsAPI(board._id, {
      columnOrderIds: dndOrderedColumnIds
    })
  }

  return (
    <Container disableGutters maxWidth={false} sx={{ height: '100vh' }}>
      <AppBar/>
      <BoardBar board={board}/>
      <BoardContent
        board={board}
        createNewColumn={createNewColumn}
        createNewCard={createNewCard}
        moveColumns={moveColumns}
      />
    </Container>
  )
}

export default Board
