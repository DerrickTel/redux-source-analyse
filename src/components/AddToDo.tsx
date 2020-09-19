import React, { useState } from 'react'
import { connect } from '../react-redux'
import { addTodo } from '../actions'

const AddTodo = (props:any) => {
  
  const [value,setValue] = useState('')

  console.log(props)

  const submit = () => {
    props.dispatch(addTodo(value))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }

  return (
    <>
      <input onChange={handleInputChange} />
      <button onClick={submit}>添加</button>
    </>
  )
}

export default connect()(AddTodo)