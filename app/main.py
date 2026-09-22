from fastapi import Depends
from fastapi import FastAPI, HTTPException
from database import SessionLocal, engine, Base
from sqlalchemy.orm import Session
from schemas import ItemCreate, ItemResponse, ListResponse, ListUpdate, ItemUpdate, ListCreate
from fastapi.middleware.cors import CORSMiddleware
from app.services import list_service, item_service
from pydantic import BaseModel
from typing import List
from models import ItemList


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# client wants to get
@app.get("/")
def root():
    return {"status": "ok"}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# API routes
# create item
@app.post("/items", response_model=ItemResponse, status_code=201)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    return item_service.create_item(db, item.text, item.list_id)


# create list
@app.post("/item_lists")
def create_list(data: ListCreate, db: Session = Depends(get_db)):
    l = ItemList(name=data.name, color=data.color)
    print(data)
    db.add(l)
    db.commit()
    db.refresh(l)
    return l


# delete list
@app.delete("/item_lists/{item_list_id}", status_code=204)
def delete_item_list(item_list_id: int, db: Session = Depends(get_db)):
    list_service.delete_item_list(db, item_list_id)


@app.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item_service.delete_item(db, item_id)


# get all item_lists
@app.get("/item_lists", response_model=list[ListResponse])
def get_lists(db: Session = Depends(get_db)):
    return list_service.get_lists(db)


# get all items
@app.get("/items", response_model=List[ItemResponse])
def get_items(list_id: int,db: Session = Depends(get_db)):
    return item_service.get_items(db, list_id)


# get one item
@app.get("/items/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    return item_service.get_item(db, item_id)


# toggle item complete
@app.patch("/items/{item_id}/toggle", response_model=ItemResponse)
def toggle_item_completed(item_id: int, db: Session = Depends(get_db)):
    return item_service.toggle_item_completed(db, item_id)


# edit item
@app.put("/items/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, updated_item: ItemUpdate, db: Session = Depends(get_db)):
    return item_service.update_item(db, item_id, updated_item)


# edit item_lists
@app.put("/item_lists/{item_list_id}", response_model=ListResponse)
def update_item_list(
    item_list_id: int,  # which row to update
    updated: ListUpdate,  # new values sent from frontend
    db: Session = Depends(get_db)  # database connection
):
    lst = db.query(ItemList).filter(ItemList.id == item_list_id).first()

    print("ID:", item_list_id)
    print("BEFORE:", lst.name, lst.color)

    lst.color = updated.color
    lst.name = updated.name
    db.commit()
    db.refresh(lst)
    return lst

