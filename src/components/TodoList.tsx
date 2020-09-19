import React from 'react'
import { connect } from '../react-redux'

const TodoList = (props:any) => {
  console.log(props)
  return(
  <ul>
    {props.todos.map((todo:any) => (
      <div key={todo.id}>
        {todo.name}
      </div>
    ))}
  </ul>
)}

export default connect((state:any)=>{
  console.log(state)
  // debugger
  return {
    // todos: state.firstReducer.todos
    todos:state.todos
  }
})(TodoList)