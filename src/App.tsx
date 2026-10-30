import { Dashboard } from './components/Dashboard/Dashboard'
import { CredentialsProvider } from './state/CredentialsProvider'

function App() {
  return (
    <CredentialsProvider>
      <Dashboard />
    </CredentialsProvider>
  )
}

export default App
