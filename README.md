# n8n Datastore PG Node

An n8n node that provides a configurable key-value store with support for both in-memory and PostgreSQL storage. This node is useful for sharing data between different workflow executions with options for temporary (in-memory) or persistent (PostgreSQL) storage.

**Based on:** [korotovsky/n8n-nodes-datastore](https://github.com/korotovsky/n8n-nodes-datastore)

It is no-code solution for `getWorkflowStaticData()`, Complex round-robin ping-pong via S3 or any similar approach where you tried to achieve any kind of pseudo persistence in your workflows, where you practically required to write JavaScript or integrate complex chains of nodes together in your workflows.

## Feature demo

![image.gif](images/image.gif)

## Key Features

*   **Set Value:** Store a string or JSON object associated with a unique key.
*   **Get Value:** Retrieve a stored value using its key.
*   **Clear Value:** Remove a specific key-value pair from the store.
*   **Clear All:** Remove all key-value pairs from the store.
*   **Storage Backend Options:** Choose between In-Memory (default) or PostgreSQL storage.
*   **PostgreSQL Support:** Persistent storage with connection pooling and SSL support.
*   Configurable output for Set/Clear operations (pass through input or output status).

## Prerequisites

*   An active n8n instance.
*   For PostgreSQL storage: A PostgreSQL database (version 9.5 or later).

## Installation

If this node is not part of the core n8n nodes, follow these steps to install it as a community node:

 - Go to "Settings" -> "Community nodes"
 - Click "Install"
 - Enter "n8n-nodes-datastore-pg"
 - Ack security risks and proceed with the installation

Later on you will find this node under the name "Datastore PG" in the nodes search box.

## Configuration

### Storage Backend

When adding a Datastore PG node to your workflow, you can choose between two storage options:

#### In-Memory Storage (Default)
- Data is stored in the n8n process memory
- Fast access but data is lost when n8n restarts
- No additional configuration required
- Perfect for temporary data sharing within workflow sessions

#### PostgreSQL Storage
- Data is persistently stored in a PostgreSQL database
- Survives n8n restarts and provides true persistence
- Requires PostgreSQL database configuration
- Supports connection pooling and SSL connections

### PostgreSQL Configuration

When selecting PostgreSQL as the storage backend, configure the following connection parameters:

- **Host**: PostgreSQL server hostname (default: localhost)
- **Port**: PostgreSQL server port (default: 5432)
- **Database**: PostgreSQL database name
- **Username**: PostgreSQL username
- **Password**: PostgreSQL password
- **SSL**: Enable SSL connection (recommended for production)
- **Max Connections**: Maximum connections in the pool (default: 10)

### Database Setup

For PostgreSQL storage, the node will automatically create the required table:

```sql
CREATE TABLE IF NOT EXISTS datastore_values (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Make sure your PostgreSQL user has the necessary permissions to create tables and indexes.

## Addressed issues

- [Keep variables between executions](https://community.n8n.io/t/keep-variables-between-executions/5595)
- [How to store data as global variable?](https://community.n8n.io/t/how-to-store-data-as-global-variable/27125)
- [Store values between Executions](https://community.n8n.io/t/store-values-between-executions/23959)
- [How to store variables based on dynamic data, for use throughout workflow](https://community.n8n.io/t/how-to-store-variables-based-on-dynamic-data-for-use-throughout-workflow/68826/4)
- [Best way to store global variable in n8n community edition](https://www.reddit.com/r/n8n/comments/1gptv3c/best_way_to_store_global_variable_in_n8n/)
- [Community edition environments and variables](https://www.reddit.com/r/n8n/comments/18cz4f8/community_edition_environments_and_variables/)
- [Set a value and update each time the workflow runs](https://community.n8n.io/t/set-a-value-and-update-each-time-the-workflow-runs/35083)
- [How can I share a variable between two workflows in n8n?](https://community.n8n.io/t/how-can-i-share-a-variable-between-two-workflows-in-n8n/102094)
- ... :D

## FAQ

 - How to reference all input values (table data, JSON-array) and save it into specified key?
   - You have to Select type `Value Data Type` = `JSON` and in `Value` make expression something like `{{ $json }}`. See the screenshot below:
     <details><summary>How to store entire input as JSON</summary>
     <img src="images/howto-1.png">
</details>

## Important Considerations & Limitations

### In-Memory Storage
 - **Data Persistence**: Data stored in memory will be lost when n8n is restarted.
 - **Memory Consumption**: Storing very large amounts of data or a very large number of keys can consume significant server memory. Use with caution for large datasets.
 - **Concurrency**: In-memory data is shared across all workflow executions within the same n8n instance.

### PostgreSQL Storage
 - **Database Performance**: Large datasets may impact database performance. Consider indexing and query optimization for production use.
 - **Connection Management**: The node uses connection pooling to efficiently manage database connections.
 - **Data Types**: All values are stored as JSONB in PostgreSQL, allowing for flexible data structures while maintaining query performance.
 - **Backup and Recovery**: Ensure proper database backup procedures are in place for production deployments.

### General Limitations
 - **Not a Replacement for Dedicated Solutions**: For complex data management requirements, consider using dedicated database nodes or external services.
 - **Security**: For PostgreSQL storage, ensure proper network security and use SSL connections in production environments.

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
