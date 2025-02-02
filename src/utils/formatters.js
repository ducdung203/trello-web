/**
 * YouTube: TrungQuanDev - Một Lập Trình Viên
 * Created by trungquandev.com's author on Jun 28, 2023
 */
/**
 * Capitalize the first letter of a string
 */
export const capitalizeFirstLetter = (val) => {
  if (!val) return ''
  return `${val.charAt(0).toUpperCase()}${val.slice(1)}`
}
export const generatePlaceholderCard = (column) => {
  return {
    _id: '${column._id}-placeholder-card',
    boardId: column.boardId,
    columnId: column._id,
    FE_placeholderCard: true
  }
}


// /**
//  * Example:
//  */
// const stringTest = 'trungquandev'
// const capString = capitalizeFirstLetter(stringTest)

// console.log('stringTest:', stringTest)
// console.log('capString:', capString)
// /**
//  * Results:
//  *
//  * stringTest: Of course, nothing changes =))
//  * capString: Trungquandev
//  */