import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('http://localhost:8000/')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => setMessage('Error connecting to backend'))
  }, [])

  return (
    <div>
      <h1>Frontend + Backend</h1>
      <p>Backend says: {message}</p>
    </div>
  )
}

export default App