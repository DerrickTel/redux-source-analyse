const initState = {
  todos: []
}

const todos = (state = initState, action) => {
  console.log('reducer的action', action);
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state
      }
    case 'TOGGLE_TODO':
      return state.map(
        todo =>
          todo.id === action.id ? { ...todo, completed: !todo.completed } : todo
      )
    default: {
      return state
    }
      
  }
}

export default todos