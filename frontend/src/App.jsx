import { useState, useEffect } from 'react'
import './App.css'

// app component: owns state and data loading
function App() {
  /* ---------------- STATE ----------------
    useState
    changes → re-render happens
    useRef
    changes → NO re-render
  */
  const [activeListId, setActiveListId] = useState(null)
  const [editingColor, setEditingColor] = useState("#666")
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState("")
  const [editingListId, setEditingListId] = useState(null)
  const [editingListValue, setEditingListValue] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isItemOpen, setIsItemOpen] = useState(false)
  const [lists, setLists] = useState([])
  const [items, setItems] = useState([])
  const [listName, setListName] = useState("")
  const [newItemText, setNewItemText] = useState("")
  const [newListColor, setNewListColor] = useState("#666666")
  const activeListName = lists.find(l => l.id === activeListId)?.name
  const [sidebarWidth, setSidebarWidth] = useState(200)

  /* ---------------- EFFECTS (React lifecycle hooks) ------ */
  // Load lists (ONLY ids + names)
  useEffect(() => {
    const load = async () => {
      const res = await fetch("http://localhost:8000/item_lists")
      const data = await res.json()

      console.log("lists response:", data)

      setLists(data)

      if (data.length > 0) {
        setActiveListId(data[0].id)
      } else {
        setActiveListId(null)
      }
    }

    load().catch(console.error)
  }, [])

  // Load items (ONLY for active list)
  useEffect(() => {
    if (!activeListId) return

    const loadItems = async () => {
      const res = await fetch(
        `http://localhost:8000/items?list_id=${activeListId}`
      )
      const data = await res.json()

      setItems(data)
    }

    loadItems().catch(console.error)
  }, [activeListId])

  useEffect(() => {
    console.log("activeListId:", activeListId)
  }, [activeListId])

  /* ------- FUNCTIONS (LOGIC) communicates with the backend ------ */
  // Create item (append only items)
  const createItem = async (text) => {
    const res = await fetch("http://localhost:8000/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, list_id: activeListId }),
    })

    const newItem = await res.json()
    setItems(prev => [...prev, newItem])
  }

  // Create list (append only list data)
  const randomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
  const createList = async () => {
    if (!listName) return

    const res = await fetch("http://localhost:8000/item_lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: listName,
        color: newListColor
      }),
    })

    const newList = await res.json()
    console.log("new list from server:", newList)

    setLists(prev => [...prev, newList])
    setActiveListId(newList.id)
    setItems([])
    setListName("")
    setNewListColor("#666")
  }

  const deleteList = async (id) => {
    await fetch(`http://localhost:8000/item_lists/${id}`, {
      method: "DELETE",
    })

    setLists(prev => prev.filter(l => l.id !== id))
  }

  const deleteItem = async (id) => {
    await fetch(`http://localhost:8000/items/${id}`, {
      method: "DELETE",
    })

    setItems(prev => prev.filter(t => t.id !== id))
  }

  const toggleItem = async (id) => {
    await fetch(`http://localhost:8000/items/${id}/toggle`, {
      method: "PATCH",
    })

    setItems(prev =>
      prev.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    )
  }

  const startResize = (e) => {
    const startX = e.clientX
    const startWidth = sidebarWidth

    const onMove = (ev) => {
      const next = startWidth + (ev.clientX - startX)
      setSidebarWidth(Math.max(160, Math.min(400, next)))
    }

    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const updateItem = async (id, text, color) => {
    await fetch(`http://localhost:8000/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, color: color ?? "#666" }),
    })

    setItems(prev =>
      prev.map(t =>
        t.id === id ? { ...t, text, color: color ?? t.color ?? "#666" } : t
      )
    )

    setEditingId(null)
    setEditValue("")
  }

  const updateList = async (id, name, color) => {
    await fetch(`http://localhost:8000/item_lists/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    })

    setLists(prev =>
      prev.map(l =>
        l.id === id ? { ...l, name, color } : l
      )
    )

    setEditingListId(null)
    setEditingListValue("")
  }

  const activeListColor = lists.find(l => l.id === activeListId)?.color
  console.log("activeListId:", activeListId, "activeListColor:", activeListColor, "lists:", lists)

  /* ---------------- Return (UI) ---------------- */
  return (
    <div className="app">

      {/* LEFT: lists */}
      <div className="sidebar" style={{ width: sidebarWidth }}>
        <h2>Lists</h2>

        <div className="new-list-btn" >
          <button onClick={() => { setNewListColor(randomColor()); setIsOpen(true) }}>New List</button>
        </div>

        <ul>
          {[...lists]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(list => (
            <ItemList
              activeListId={activeListId}
              key={list.id}
              list={list}
              setActiveListId={setActiveListId}
              deleteList={deleteList}
              editingListId={editingListId}
              editingListValue={editingListValue}
              setEditingListId={setEditingListId}
              setEditingListValue={setEditingListValue}
              updateList={updateList}
              editingColor={editingColor}
              setEditingColor={setEditingColor}
            />
          ))}
        </ul>
      </div>

      <div
        className="resizer"
        onMouseDown={startResize}
      />

      {/* RIGHT: items */}
      <div className="content">
        <h2
          style={{
            border: `1px solid ${activeListColor || "#666"}`,
            backgroundColor: `${activeListColor || "#666"}20`
          }}
        >
          {activeListName}
        </h2>
        {/* create item section */}
        <div className="add-item">
          <button onClick={() => setIsItemOpen(true)}>
            New Item
          </button>
        </div>
          <ul>
            {items.map(item => (
              <Item
                key={item.id}
                item={item}
                parentColor={activeListColor}
                editingColor={editingColor}
                editingId={editingId}
                editValue={editValue}
                setEditingColor={setEditingColor}
                setEditingId={setEditingId}
                setEditValue={setEditValue}
                updateItem={updateItem}
                toggleItem={toggleItem}
                deleteItem={deleteItem}
              />
            ))}
          </ul>
        </div>

      {/* create list section */}
      {isOpen && (
        <div className="overlay" onClick={() => setIsOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <h3>New List</h3>

            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="List name"
            />

            <input
              type="color"
              value={newListColor}
              onChange={(e) => setNewListColor(e.target.value)}
            />

          <div className="modal-actions">
            <button onClick={() => setIsOpen(false)}>Cancel</button>
              <button
                onClick={() => {
                  createList()
                  setIsOpen(false)
                }}
              >
                OK
              </button>
            </div>

          </div>
        </div>
      )}

      {isItemOpen && (
        <div className="overlay" onClick={() => setIsItemOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <h3>New Item</h3>
              <form
                onSubmit={(e) => {
                  console.log("SUBMIT FIRED")
                  e.preventDefault()
                  if (!newItemText.trim()) return
                  createItem(newItemText)
                  setNewItemText("")
                  setIsItemOpen(false)
                }}
              >
                <input
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Item text"
                />
              </form>
            <div className="modal-actions">
              <button onClick={() => setIsItemOpen(false)}>
                Cancel
              </button>

              <button
                onClick={() => {
                  if (!newItemText.trim()) return
                  createItem(newItemText)
                  setNewItemText("")
                  setIsItemOpen(false)
                }}
              >
                OK
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

// shared component: view mode, edit mode,save
function EditableRow({
  children,
  color,
  isActive,
  isEditing,
  value,
  onCancel,
  onChange,
  onClick,
  onColorChange,
  onEdit,
  onSave,
  onDelete,
  showColor,
  style
  }) {
  return (
    <li
      className={`row ${isActive ? "active" : ""}`}
      onClick={onClick}
      style={{
        ...style,
        '--row-color': color || '#666'
      }}
    >

      {isEditing ? (
        <>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />

          {showColor && (
            <input
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
            />
          )}

          <button onClick={onSave}>save</button>
          <button onClick={onCancel}>cancel</button>
        </>
      ) : (
        <>
          {children}

          <div className="actions">
            <button onClick={onEdit}>edit</button>
            <button onClick={onDelete}>delete</button>
          </div>
        </>
      )}
    </li>
  )
}

// item component: renders a single list row
function Item(props) {
  const {
    item,
    editingId,
    editValue,
    parentColor,
    setEditingId,
    setEditValue,
    updateItem,
    deleteItem,
    toggleItem,
  } = props

  return (
    <EditableRow
      color={parentColor}
      isEditing={editingId === item.id}
      value={editValue}
      onCancel={() => {
        setEditingId(null)
        setEditValue("")
      }}
      onChange={setEditValue}
      onColorChange={() => {}}
      onEdit={() => {
        setEditingId(item.id)
        setEditValue(item.text)
      }}
      onSave={() => updateItem(item.id, editValue, parentColor, item.completed)}
      onDelete={() => deleteItem(item.id)}
      showColor={false}
      style={{
        '--item-bg-color': parentColor,
        '--item-border-color': parentColor
      }}
    >
      <span
        onClick={() => toggleItem(item.id)}
        style={{
          textDecoration: item.completed ? 'line-through' : 'none'
        }}
      >
        {item.text}
      </span>
    </EditableRow>
  )
}

// list item component: renders a list of lists
function ItemList(props) {
  const {
    activeListId,
    deleteList,
    editingColor,
    editingListId,
    editingListValue,
    setEditingColor,
    setEditingListId,
    setEditingListValue,
    updateList,
    list,
    setActiveListId,
  } = props

  const isActive = activeListId === list.id

  return (
    <EditableRow
      color={editingListId === list.id ? editingColor : list.color}      isActive={isActive}
      isEditing={editingListId === list.id}
      value={editingListValue}
      onCancel={() => {
        setEditingListId(null)
        setEditingListValue("")
      }}
      onChange={setEditingListValue}
      onClick={() => setActiveListId(list.id)}
      onColorChange={setEditingColor}
      onEdit={() => {
        setEditingListId(list.id)
        setEditingListValue(list.name)
        setEditingColor(list.color)
      }}
      onSave={() => updateList(list.id, editingListValue, editingColor)}
      onDelete={() => deleteList(list.id)}
      showColor={true}
      style={{
        '--list-bg-color': list.color,
        '--list-border-color': list.color
      }}
    >
      <span className={`list-name ${isActive ? "active" : ""}`}>
        {list.name}
      </span>
    </EditableRow>
  )
}

export default App
