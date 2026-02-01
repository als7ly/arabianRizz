# MongoDB Atlas Vector Search Setup

To enable the RAG (Retrieval-Augmented Generation) features for both User History and Global Knowledge, you must create Vector Search Indexes on your MongoDB Atlas clusters.

## 1. Global Knowledge Index

This index allows the Wingman to retrieve relevant cultural tips and crawled data.

1.  Log in to **MongoDB Atlas**.
2.  Navigate to your cluster and select **Atlas Search**.
3.  Click **Create Search Index**.
4.  Select **JSON Editor**.
5.  Select the **Database** and **Collection**: `globalknowledges`.
6.  Name the index: `vector_index`.
7.  Paste the following configuration:

```json
{
  "fields": [
    {
      "numDimensions": 1536,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    },
    {
      "path": "language",
      "type": "filter"
    },
    {
      "path": "status",
      "type": "filter"
    }
  ]
}
```

*Note: `numDimensions` must match your embedding model (OpenAI `text-embedding-3-small` is 1536).*

## 2. Message History Index

This index allows the Wingman to remember context from previous conversations.

1.  Repeat the steps above but select the collection: `messages`.
2.  Name the index: `vector_index`.
3.  Paste the following configuration:

```json
{
  "fields": [
    {
      "numDimensions": 1536,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    },
    {
      "path": "girl",
      "type": "filter"
    }
  ]
}
```

## Troubleshooting

-   **Index Pending:** Creation can take a few minutes.
-   **No Results:** Ensure your query sends an embedding vector of the same dimension (1536).
-   **Filter Not Working:** Ensure the fields `language`, `status`, and `girl` are defined as `filter` type in the index definition as shown above.
