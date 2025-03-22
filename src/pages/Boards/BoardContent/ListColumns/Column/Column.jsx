import AddCardIcon from '@mui/icons-material/AddCard'
import Cloud from '@mui/icons-material/Cloud'
import ContentCopy from '@mui/icons-material/ContentCopy'
import ContentCut from '@mui/icons-material/ContentCut'
import ContentPaste from '@mui/icons-material/ContentPaste'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import DragHandleIcon from '@mui/icons-material/DragHandle'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import ListCards from './ListCards/ListCards'
import { mapOrder } from '~/utils/sorts'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import theme from '~/theme'
import TextField from '@mui/material/TextField'
import CloseIcon from '@mui/icons-material/Close'

function Column({ column }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: column._id, data: { ...column } })
  const dndKitColumnStyles = {
    touchAction: 'none',
    transform: CSS.Translate.toString(transform),
    transition,
    //chiều cao phải là 100%, và phải kết hợp {...listeners} trong box
    height:'100%',
    opacity:isDragging? 0.5 : undefined
  }

  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }
  const OrderCard = mapOrder(column?.cards, column?.cardOrderIds, '_id')

  const [openNewCardForm, setOpenNewCardForm] = useState(false)
  const toggleNewCardForm = () => setOpenNewCardForm(!openNewCardForm)

  const [newCardTitle, setNewCardTitle] = useState('')
  const addNewCard = () => {
    if (!newCardTitle)
    // console.error('Card title is required')
      return
      // console.log(newCardTitle)
      // call API

    //đóng trạng thái thêm card và clear input
    toggleNewCardForm()
    setNewCardTitle('')
  }
  return (
    //phải bọc div ở đây vè vấn đề chiều cao
    <div ref={setNodeRef} style={dndKitColumnStyles} {...attributes}>
      <Box {...listeners}
        sx={{
          minWidth:'300px',
          maxWidth:'300px',
          bgcolor:(theme) => (theme.palette.mode === 'dark' ? '#333643' : '#ebecf0'),
          ml:2,
          borderRadius:'6px',
          height:'fit-content',
          maxHeight:(theme) => `calc(${theme.trello.boardContentHeight} - ${theme.spacing(5)})`

        }}>
        {/* Box column header */}
        <Box sx={{
          height: (theme) => theme.trello.columnHeaderHeight,
          p:2,
          display:'flex',
          alignItems:'center',
          justifyContent:'space-between'
        }}>
          <Typography variant='h6' sx={{
            fontSize:'1rem',
            fontWeight:'bold',
            cursor:'pointer'
          }}>{column.title}</Typography>
          <Box>
            <Tooltip title="More options">
              <ExpandMoreIcon
                sx={{ color:'primary.main', cursor:'pointer' }}
                id="basic-column-dropdown"
                aria-controls={open ? 'basic-menu-column-dropdown' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
              />
            </Tooltip>
            <Menu
              id="basic-menu-column-dropdown"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'basic-column-dropdown'
              }}
            >
              <MenuItem>
                <ListItemIcon>
                  <AddCardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Add new card</ListItemText>
              </MenuItem>
              <MenuItem>
                <ListItemIcon>
                  <ContentCut fontSize="small" />
                </ListItemIcon>
                <ListItemText>Cut</ListItemText>
              </MenuItem>
              <MenuItem>
                <ListItemIcon>
                  <ContentCopy fontSize="small" />
                </ListItemIcon>
                <ListItemText>Copy</ListItemText>
              </MenuItem>
              <MenuItem>
                <ListItemIcon>
                  <ContentPaste fontSize="small" />
                </ListItemIcon>
                <ListItemText>Paste</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem>
                <ListItemIcon>
                  <DeleteForeverIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Remove this column</ListItemText>
              </MenuItem>
              <MenuItem>
                <ListItemIcon>
                  <Cloud fontSize="small" />
                </ListItemIcon>
                <ListItemText>Archive this column</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>
        {/* Box column list card */}
        <ListCards cards={OrderCard}/>
        {/* Box column footer */}
        <Box sx={{
          height:(theme) => theme.trello.columnFooterHeight,
          p:2
        }}>
          {!openNewCardForm
            ?<Box sx={{
              height:'100%',
              display:'flex',
              alignItems:'center',
              justifyContent:'space-between'
            }}>
              <Button startIcon={<AddCardIcon/>} onClick={toggleNewCardForm}>Add new card</Button>
              <Tooltip title="Drag to move">
                <DragHandleIcon sx={{ cursor:'pointer' }}/>
              </Tooltip>
            </Box>
            :<Box sx={{
              height:'100%',
              display:'flex',
              alignItems:'center',
              gap:1
            }}>
              <TextField
                label="Enter card title"
                type="text"
                size='small'
                variant='outlined'
                autoFocus
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                sx={{
                  '& label': { color : 'text.primary' },
                  '& input': {
                    color : (theme) => theme.palette.primary.main,
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#333643' : 'white')
                  },
                  '& label.Mui-focused': { color : (theme) => theme.palette.primary.main },
                  '& .MuiOutlinedInput-root':{
                    '& fieldset': { borderColor: (theme) => theme.palette.primary.main },
                    '&:hover fieldset': { borderColor: (theme) => theme.palette.primary.main },
                    '&.Mui-focused fieldset': { borderColor: (theme) => theme.palette.primary.main}
                  },
                  '& .MuiOutlinedInput-input': {
                    borderRadius: 1
                  }
                }}/>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <Button onClick={addNewCard}
                  variant='contained' color='success' size='small'
                  sx={{
                    boxShadow: 'none',
                    border: '0.5 px solid',
                    borderColor: theme => theme.palette.success.main,
                    '&:hover': { bgcolor: (theme) => theme.palette.success.main }
                  }}
                >Add</Button>
                <CloseIcon
                  fontSize='small'
                  sx={{ color: (theme) => theme.palette.warning.light, cursor: 'pointer' }}
                  onClick={toggleNewCardForm}
                />
              </Box>
            </Box>
          }
        </Box>
      </Box>
    </div>
  )
}

export default Column
