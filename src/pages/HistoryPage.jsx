const HistoryPage = ({ sales }) => {
  const history = Object.values(sales || {}).sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>ประวัติการขาย</h2>
          <p>สรุปรายการขายล่าสุดทั้งหมดจากฐานข้อมูล</p>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>วันที่</th>
              <th>ลูกค้า</th>
              <th>ยอดรวม (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record, index) => (
              <tr key={index}>
                <td>{record.date}</td>
                <td>{record.customer}</td>
                <td>{record.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default HistoryPage;
