const ManagePage = ({ activeTab, customers, products, banks, onTabChange, canShowBank }) => {
  const tabData = {
    customers: {
      title: 'ลูกค้า',
      items: Object.values(customers || {}),
      columns: ['ชื่อ', 'โทรศัพท์', 'อีเมล'],
      row: (item) => [item.name, item.phone, item.email],
    },
    products: {
      title: 'สินค้า',
      items: Object.values(products || {}),
      columns: ['ชื่อสินค้า', 'ราคา', 'สต็อก'],
      row: (item) => [item.name, `${item.price} บาท`, item.stock],
    },
    banks: {
      title: 'รายการธนาคาร',
      items: Object.values(banks || {}),
      columns: ['ธนาคาร', 'เลขบัญชี'],
      row: (item) => [item.bank, item.account],
    },
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>จัดการข้อมูล</h2>
          <p>แก้ไขข้อมูลลูกค้า สินค้า และรายการธนาคาร</p>
        </div>
      </div>

      <div className="tab-row">
        <button className={activeTab === 'customers' ? 'tab active' : 'tab'} onClick={() => onTabChange('customers')}>
          ลูกค้า
        </button>
        <button className={activeTab === 'products' ? 'tab active' : 'tab'} onClick={() => onTabChange('products')}>
          สินค้า
        </button>
        {canShowBank && (
          <button className={activeTab === 'banks' ? 'tab active' : 'tab'} onClick={() => onTabChange('banks')}>
            รายการธนาคาร
          </button>
        )}
      </div>

      <div className="table-card">
        <h3>{tabData[activeTab].title}</h3>
        <table>
          <thead>
            <tr>{tabData[activeTab].columns.map((title) => <th key={title}>{title}</th>)}</tr>
          </thead>
          <tbody>
            {tabData[activeTab].items.map((item, index) => (
              <tr key={index}>
                {tabData[activeTab].row(item).map((value, cellIndex) => (
                  <td key={cellIndex}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ManagePage;
