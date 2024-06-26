import { mdiEye } from '@mdi/js'
import React, { useState } from 'react'
import Button from '../Button'
import Buttons from '../Buttons'
import CardBoxModal from '../CardBox/Modal'
import ReactMarkdown from 'react-markdown'

interface Task {
  task_id: string;
  input: string;
  command: string;
  script_code: string;
  output: string;
  interpretation: string;
}

interface Props {
  tasks: Task[];
}

const TableTasks: React.FC<Props> = ({ tasks }) => {
  const perPage = 10
  const [currentPage, setCurrentPage] = useState(0)
  const [isModalActive, setIsModalActive] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const tasksPaginated = tasks.slice(perPage * currentPage, perPage * (currentPage + 1))
  const numPages = Math.ceil(tasks.length / perPage)
  const pagesList = Array.from({ length: numPages }, (_, i) => i)

  const handleModalOpen = (task: Task) => {
    setSelectedTask(task)
    setIsModalActive(true)
  }

  const handleModalClose = () => {
    setSelectedTask(null)
    setIsModalActive(false)
  }

  return (
    <>
      <CardBoxModal
        title="Task Details"
        buttonColor="info"
        buttonLabel="Close"
        isActive={isModalActive}
        onConfirm={handleModalClose}
        onCancel={handleModalClose}
        className="max-w-5xl" // 모달의 최대 너비를 늘립니다.
      >
        {selectedTask && (
          <div className="overflow-auto max-h-96">
            <h3 className="font-semibold text-lg mb-2">Task ID: {selectedTask.task_id}</h3>
            <div className="mb-4">
              <strong>Input:</strong>
              <p className="p-2 bg-gray-100 rounded">{selectedTask.input}</p>
            </div>
            <div className="mb-4">
              <strong>Command:</strong>
              <p className="p-2 bg-gray-100 rounded">{selectedTask.command}</p>
            </div>
            <div className="mb-4">
              <strong>Script Code:</strong>
              <p className="p-2 bg-gray-100 rounded">{selectedTask.script_code}</p>
            </div>
            <div className="mb-4">
              <strong>Output:</strong>
              <p className="p-2 bg-gray-100 rounded">{selectedTask.output}</p>
            </div>
            <div className="mb-4">
              <strong>Interpretation:</strong>
              <div className="p-2 bg-gray-100 rounded">
                <ReactMarkdown>{selectedTask.interpretation}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </CardBoxModal>

      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th>Index</th>
            <th>TimeStamp</th>
            <th>Task ID</th>
            <th>Input</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {tasksPaginated.map((task, index) => (
            <tr key={task.task_id}>
              <td>{currentPage * perPage + index + 1}</td>
              <td>{task.timestamp}</td>
              <td>{task.task_id}</td>
              <td>{task.input}</td>
              <td>
                <Buttons type="justify-start lg:justify-end" noWrap>
                  <Button
                    color="info"
                    icon={mdiEye}
                    onClick={() => handleModalOpen(task)}
                    small
                  />
                </Buttons>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-3 lg:px-6 border-t border-gray-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between py-3 md:py-0">
          <Buttons>
            {pagesList.map((page) => (
              <Button
                key={page}
                active={page === currentPage}
                label={page + 1}
                color={page === currentPage ? 'lightDark' : 'whiteDark'}
                small
                onClick={() => setCurrentPage(page)}
              />
            ))}
          </Buttons>
          <small className="mt-6 md:mt-0">
            Page {currentPage + 1} of {numPages}
          </small>
        </div>
      </div>
    </>
  )
}

export default TableTasks
