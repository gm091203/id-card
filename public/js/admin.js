document.addEventListener('DOMContentLoaded', () => {
  // 0. Verify admin credentials
  const verifyAdmin = () => {
    if (sessionStorage.getItem('isAdmin') !== 'true') {
      const pw = prompt('관리자 비밀번호를 입력하세요:');
      if (pw === 'khyfool') {
        sessionStorage.setItem('isAdmin', 'true');
      } else {
        alert('권한이 없습니다. 메인 페이지로 이동합니다.');
        window.location.href = '/';
      }
    }
  };
  verifyAdmin();

  // Global Data Store
  let allOrders = [];

  // Elements - Table
  const tableBody = document.getElementById('ordersTableBody');
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');

  // Elements - Stats
  const statTotal = document.getElementById('statTotal');
  const statPending = document.getElementById('statPending');
  const statCompleted = document.getElementById('statCompleted');

  // Elements - Photo Modal
  const photoModal = document.getElementById('photoModal');
  const modalFullImage = document.getElementById('modalFullImage');
  const photoMetaName = document.getElementById('photoMetaName');
  const btnDownloadPhoto = document.getElementById('btnDownloadPhoto');
  const btnClosePhotoModal = document.getElementById('btnClosePhotoModal');

  // Fetch orders from server
  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      allOrders = await response.json();
      updateStats();
      applyFilters();
    } catch (error) {
      console.error('Error fetching orders:', error);
      tableBody.innerHTML = `<tr><td colspan="10" class="no-data text-accent">데이터를 불러오는 중 오류가 발생했습니다.</td></tr>`;
    }
  };

  // Update statistic dashboards
  const updateStats = () => {
    const total = allOrders.length;
    const pending = allOrders.filter(o => o.status === 'pending_deposit').length;
    const completed = allOrders.filter(o => o.status === 'completed').length;

    statTotal.textContent = total;
    statPending.textContent = pending;
    statCompleted.textContent = completed;
  };

  // Render orders inside the table
  const renderOrdersTable = (orders) => {
    if (orders.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="10" class="no-data">주문 내역이 존재하지 않습니다.</td></tr>`;
      return;
    }

    tableBody.innerHTML = orders.map(order => {
      const orderDate = new Date(order.createdAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      const badgeClass = order.status === 'completed' ? 'completed' : 'pending_deposit';
      const badgeText = order.status === 'completed' ? '제작/입금 완료' : '입금 대기';
      
      // Action button based on status
      const actionButton = order.status === 'completed' 
        ? `<button class="btn-action toggle-complete" data-id="${order.id}" data-target-status="pending_deposit">
            <i data-lucide="rotate-ccw"></i> 대기 전환
           </button>`
        : `<button class="btn-action toggle-complete" data-id="${order.id}" data-target-status="completed">
            <i data-lucide="check"></i> 입금 완료 처리
           </button>`;

      const deleteButton = `<button class="btn-action btn-delete delete-order" data-id="${order.id}" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: #ef4444; margin-left: 6px;">
                              <i data-lucide="trash-2"></i> 삭제
                            </button>`;

      return `
        <tr id="row-${order.id}">
          <td class="font-mono text-secondary">${orderDate}</td>
          <td class="font-mono text-cyan">${order.orderCode}</td>
          <td>
            <div class="td-name-wrapper">
              <span class="td-name-kr">${order.name}</span>
              <span class="td-name-en">${order.hanjaName || '-'}</span>
            </div>
          </td>
          <td class="font-mono">${order.birth} / ${order.gender || '미정'}</td>
          <td>
            <img 
              src="${order.photoPath}" 
              alt="Photo Thumbnail" 
              class="td-photo-thumbnail" 
              data-name="${order.name}"
              title="클릭하여 원본 보기"
            >
          </td>
          <td>
            <div class="td-address-limit" title="${order.address}">${order.address}</div>
          </td>
          <td>
            <div class="td-name-wrapper" style="gap:2px;">
              <span class="font-mono text-cyan" style="font-size:0.8rem; font-weight:600;">📞 ${order.phone}</span>
              <div class="td-address-limit" style="font-size:0.78rem; color:var(--text-secondary);" title="${order.deliveryAddress}">${order.deliveryAddress}</div>
            </div>
          </td>
          <td>
            <div class="td-name-wrapper">
              <span class="font-medium">${order.depositor}</span>
              ${order.note ? `<small class="text-secondary" style="font-size:0.75rem; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="요청사항: ${order.note}">📝 ${order.note}</small>` : ''}
            </div>
          </td>
          <td>
            <span class="badge ${badgeClass}">${badgeText}</span>
          </td>
          <td>
            ${actionButton}
            ${deleteButton}
          </td>
        </tr>
      `;
    }).join('');

    // Re-create icons dynamically
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Attach interaction events
    attachTableEvents();
  };

  // Attach event handlers to dynamic table components
  const attachTableEvents = () => {
    // 1. Click Thumbnail to preview Photo Modal
    const thumbnails = tableBody.querySelectorAll('.td-photo-thumbnail');
    thumbnails.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const photoSrc = thumb.getAttribute('src');
        const userName = thumb.getAttribute('data-name');
        
        modalFullImage.src = photoSrc;
        photoMetaName.textContent = `주문자: ${userName}`;
        btnDownloadPhoto.setAttribute('href', photoSrc);
        btnDownloadPhoto.setAttribute('download', `id-photo-${userName}.jpg`);
        
        photoModal.classList.remove('hidden');
      });
    });

    // 2. Click Toggle Status
    const toggleButtons = tableBody.querySelectorAll('.toggle-complete');
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const targetStatus = btn.getAttribute('data-target-status');
        
        btn.disabled = true;
        
        try {
          const response = await fetch('/api/orders/update-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, status: targetStatus })
          });

          const result = await response.json();
          if (response.ok && result.success) {
            // Update local memory & stats, re-render
            const index = allOrders.findIndex(o => o.id === id);
            if (index !== -1) {
              allOrders[index].status = targetStatus;
            }
            updateStats();
            applyFilters();
          } else {
            alert('상태 변경에 실패했습니다. 다시 시도해 주세요.');
          }
        } catch (error) {
          console.error('Error updating status:', error);
          alert('네트워크 오류가 발생했습니다.');
        } finally {
          btn.disabled = false;
        }
      });
    });

    // 3. Click Delete Order
    const deleteButtons = tableBody.querySelectorAll('.delete-order');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('정말 이 주문 내역을 삭제하시겠습니까?\n삭제된 데이터와 사진 기록은 복구할 수 없습니다.')) {
          return;
        }

        btn.disabled = true;

        try {
          const response = await fetch('/api/orders/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id })
          });

          const result = await response.json();
          if (response.ok && result.success) {
            // Filter local orders memory
            allOrders = allOrders.filter(o => o.id !== id);
            updateStats();
            applyFilters();
          } else {
            alert(result.error || '주문 내역 삭제에 실패했습니다. 다시 시도해 주세요.');
            btn.disabled = false;
          }
        } catch (error) {
          console.error('Error deleting order:', error);
          alert('네트워크 오류가 발생했습니다.');
          btn.disabled = false;
        }
      });
    });
  };

  // Close Photo Modal
  btnClosePhotoModal.addEventListener('click', () => {
    photoModal.classList.add('hidden');
    modalFullImage.src = '';
  });

  // Filter & Search orchestration logic
  const applyFilters = () => {
    const searchQuery = searchInput.value.toLowerCase().trim();
    const selectedStatus = statusFilter.value;

    let filtered = [...allOrders];

    // Status Filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(o => o.status === selectedStatus);
    }

    // Text Search Filter
    if (searchQuery) {
      filtered = filtered.filter(o => {
        return (
          o.name.toLowerCase().includes(searchQuery) ||
          (o.hanjaName && o.hanjaName.toLowerCase().includes(searchQuery)) ||
          o.depositor.toLowerCase().includes(searchQuery) ||
          o.orderCode.toLowerCase().includes(searchQuery)
        );
      });
    }

    renderOrdersTable(filtered);
  };

  // Attach search box inputs
  searchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);

  // Initial Fetch Call
  fetchOrders();

  // Simple auto refresh every 30 seconds
  setInterval(fetchOrders, 30000);

  // 6. CSV Export click listener
  const btnExportCSV = document.getElementById('btnExportCSV');
  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', () => {
      if (allOrders.length === 0) {
        alert('내보낼 주문 내역이 없습니다.');
        return;
      }

      // Headers (BOM is prepended to prevent Excel Korean encoding crash)
      const headers = ['주문코드', '신청일시', '한글성명', '한자성명', '주민등록번호', '신분증주소', '배송연락처', '배송지주소', '입금자명', '결제상태', '금액(원)', '요청사항'];
      
      const csvRows = [headers.join(',')];

      allOrders.forEach(o => {
        const orderDate = new Date(o.createdAt).toLocaleString('ko-KR');
        const statusText = o.status === 'completed' ? '제작/입금 완료' : '입금 대기';
        
        // Escape values to prevent commas crashing row columns
        const row = [
          `"${o.orderCode}"`,
          `"${orderDate}"`,
          `"${o.name}"`,
          `"${o.hanjaName || ''}"`,
          `"${o.birth}"`,
          `"${o.address.replace(/"/g, '""')}"`,
          `"${o.phone || ''}"`,
          `"${(o.deliveryAddress || '').replace(/"/g, '""')}"`,
          `"${o.depositor}"`,
          `"${statusText}"`,
          `"${o.price}"`,
          `"${(o.note || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
        ];
        csvRows.push(row.join(','));
      });

      // Excel UTF-8 BOM representation: \ufeff
      const csvString = '\ufeff' + csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      
      // Trigger temporary download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().split('T')[0];
      
      link.setAttribute('href', url);
      link.setAttribute('download', `신분증_주문내역_${today}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
});
