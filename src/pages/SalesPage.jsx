const SalesPage = ({ user, products, customers }) => {
  const productList = Object.values(products || {});
  const customerList = Object.values(customers || {});

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>การขาย</h2>
          <p>สร้างคำสั่งขายใหม่และตรวจสอบลูกค้าปัจจุบัน</p>
        </div>
      </div>

      <div className="card-grid">
        <div className="card card-highlight">
          <h3>ผู้ใช้</h3>
          <p>{user.name}</p>
          <span className="badge">{user.role}</span>
        </div>
        <div className="card">
          <h3>ลูกค้าที่ลงทะเบียน</h3>
          <p>{customerList.length} รายการ</p>
        </div>
        <div className="card">
          <h3>สินค้าในสต็อก</h3>
          <p>{productList.length} รายการ</p>
        </div>
      </div>

      <div className="table-card">
        <h3>รายการสินค้า</h3>
        <table>
          <thead>
            <tr>
              <th>ชื่อสินค้า</th>
              <th>ราคา</th>
              <th>สต็อก</th>
            </tr>
          </thead>
          <tbody>
            {productList.map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td>{item.price} บาท</td>
                <td>{item.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default SalesPage;
