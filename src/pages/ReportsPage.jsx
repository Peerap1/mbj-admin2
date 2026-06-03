const ReportsPage = ({ data }) => {
  const customerCount = Object.keys(data.customers || {}).length;
  const productCount = Object.keys(data.products || {}).length;
  const bankCount = Object.keys(data.banks || {}).length;
  const saleCount = Object.keys(data.sales || {}).length;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>รายงาน</h2>
          <p>ภาพรวมข้อมูลระบบและการขาย</p>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3>ลูกค้า</h3>
          <p>{customerCount} รายการ</p>
        </div>
        <div className="card">
          <h3>สินค้า</h3>
          <p>{productCount} รายการ</p>
        </div>
        <div className="card">
          <h3>ธนาคาร</h3>
          <p>{bankCount} รายการ</p>
        </div>
        <div className="card">
          <h3>การขาย</h3>
          <p>{saleCount} รายการ</p>
        </div>
      </div>
    </section>
  );
};

export default ReportsPage;
