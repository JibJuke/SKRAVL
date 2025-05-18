import TableCard from "./TableCard";
import { useTables } from "../hooks/useTables";

/**
 * Renders a list of available tables from the selected location
 *
 * @param {object} tables - Array of table objects
 * @param {boolean} loading - Boolean indicating if tables are loading
 * @param {object} error - Error object if fetching tables fails
 */

const TableList = () => {
  // Get tables data and state from the custom hook
  const { tables, loading, error } = useTables();

  // Show loading state while fetching data
  if (loading) {
    return <div className="table-list">Loading tables...</div>;
  }

  // Show error state if fetch failed
  if (error) {
    return (
      <div className="table-list">Error loading tables: {error.message}</div>
    );
  }

  return (
    <div className="table-list">
      {tables.length === 0 ? (
        // Display message when no tables are available
        <p>Currently no active tables</p>
      ) : (
        // Display list of table cards
        <div className="table-cards">
          {tables.map((table) => (
            <TableCard key={table.id} table={table} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TableList;
