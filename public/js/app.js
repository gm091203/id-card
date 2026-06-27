document.addEventListener('DOMContentLoaded', () => {
  // Elements - Form Inputs
  const form = document.getElementById('orderForm');
  const inputName = document.getElementById('name');
  const inputHanjaName = document.getElementById('hanjaName');
  const inputBirth = document.getElementById('birth');
  const inputBirthBack = document.getElementById('birthBack');
  const inputAddress = document.getElementById('address');
  const inputIssueDate = document.getElementById('issueDate');
  const inputAuthority = document.getElementById('authority');
  const inputPhone = document.getElementById('phone');
  const inputDeliveryAddress = document.getElementById('deliveryAddress');
  const inputDepositor = document.getElementById('depositor');
  const inputNote = document.getElementById('note');

  // Elements - Card Preview Slots
  const card = document.getElementById('idCard');
  const cardNameKr = document.getElementById('cardNameKr');
  const cardNameHanja = document.getElementById('cardNameHanja');
  const cardBirth = document.getElementById('cardBirth');
  const cardAddress = document.getElementById('cardAddress');
  const cardIssueDate = document.getElementById('cardIssueDate');
  const cardAuthority = document.getElementById('cardAuthority');
  const cardPhotoImg = document.getElementById('cardPhotoImg');
  const photoPlaceholder = document.getElementById('photoPlaceholder');

  // Elements - Photo Upload
  const uploadArea = document.getElementById('uploadArea');
  const photoInput = document.getElementById('photoInput');
  const uploadPrompt = document.getElementById('uploadPrompt');
  const uploadPreview = document.getElementById('uploadPreview');
  const filePreviewImg = document.getElementById('filePreviewImg');
  const btnRemoveFile = document.getElementById('btnRemoveFile');

  // Elements - Payment Modal
  const paymentModal = document.getElementById('paymentModal');
  const modalDepositor = document.getElementById('modalDepositor');
  const modalDepositorConfirm = document.getElementById('modalDepositorConfirm');
  const modalOrderCode = document.getElementById('modalOrderCode');
  const btnCopyAccount = document.getElementById('btnCopyAccount');
  const btnCloseModal = document.getElementById('btnCloseModal');

  // Elements - Final Confirmation Modal
  const confirmOrderModal = document.getElementById('confirmOrderModal');
  const confirmName = document.getElementById('confirmName');
  const confirmBirth = document.getElementById('confirmBirth');
  const confirmAddress = document.getElementById('confirmAddress');
  const confirmIssue = document.getElementById('confirmIssue');
  const confirmPhone = document.getElementById('confirmPhone');
  const confirmDeliveryAddress = document.getElementById('confirmDeliveryAddress');
  const confirmDepositor = document.getElementById('confirmDepositor');
  const confirmNote = document.getElementById('confirmNote');
  const agreeTerms = document.getElementById('agreeTerms');
  const btnCancelConfirm = document.getElementById('btnCancelConfirm');
  const btnFinalSubmit = document.getElementById('btnFinalSubmit');

  // Default values
  const defaultValues = {
    name: '홍길동',
    hanjaName: '(洪吉童)',
    birth: '000101 - 1234567',
    address: '서울특별시 마포구 백범로 35',
    issueDate: '',
    authority: '마포구청장'
  };

  // Set Default Issue Date on Preview to Today
  const getTodayFormatted = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const actualDd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}. ${mm}. ${actualDd}.`;
  };
  cardIssueDate.textContent = getTodayFormatted();
  // Set default issue date input min/max if helpful, but today default is good
  
  // 1. Synchronize form entries with Card Preview
  const updateCardText = () => {
    // Korean Name
    cardNameKr.textContent = inputName.value.trim() || defaultValues.name;

    // Hanja Name
    if (inputHanjaName.value.trim()) {
      cardNameHanja.textContent = `(${inputHanjaName.value.trim()})`;
    } else {
      cardNameHanja.textContent = defaultValues.hanjaName;
    }

    // Birth Date (Combine front and back)
    const birthVal = inputBirth.value.trim();
    const birthBackVal = inputBirthBack.value.trim();
    if (birthVal || birthBackVal) {
      cardBirth.textContent = `${birthVal || '000101'} - ${birthBackVal || '1234567'}`;
    } else {
      cardBirth.textContent = defaultValues.birth;
    }

    // Address
    cardAddress.textContent = inputAddress.value.trim() || defaultValues.address;

    // Issue Date
    if (inputIssueDate.value) {
      const parts = inputIssueDate.value.split('-'); // yyyy-mm-dd
      cardIssueDate.textContent = `${parts[0]}. ${parts[1]}. ${parts[2]}.`;
    } else {
      cardIssueDate.textContent = getTodayFormatted();
    }

    // Authority
    cardAuthority.textContent = inputAuthority.value.trim() || defaultValues.authority;
  };

  // Attach keyup and change event listeners to all input targets
  const inputsToTrack = [inputName, inputHanjaName, inputBirth, inputBirthBack, inputAddress, inputIssueDate, inputAuthority];
  inputsToTrack.forEach(element => {
    if (element) {
      element.addEventListener('input', updateCardText);
      element.addEventListener('change', updateCardText);
    }
  });

  // 3. Photo upload handler
  const loadPhoto = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('이미지 파일(PNG, JPG)만 업로드할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // Set to preview image inside input form
      filePreviewImg.src = e.target.result;
      uploadPrompt.classList.add('hidden');
      uploadPreview.classList.remove('hidden');

      // Set to ID Card Frame
      cardPhotoImg.src = e.target.result;
      cardPhotoImg.classList.remove('hidden');
      photoPlaceholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
    }, false);
  });

  uploadArea.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      photoInput.files = files; // Sync back to standard file input element
      loadPhoto(files[0]);
    }
  });

  uploadArea.addEventListener('click', (e) => {
    // Only trigger input click if clicking prompt elements
    if (e.target.closest('#btnRemoveFile')) return;
    photoInput.click();
  });

  photoInput.addEventListener('change', () => {
    if (photoInput.files.length > 0) {
      loadPhoto(photoInput.files[0]);
    }
  });

  // Remove uploaded photo
  btnRemoveFile.addEventListener('click', (e) => {
    e.stopPropagation();
    photoInput.value = '';
    
    // Reset form preview
    filePreviewImg.src = '';
    uploadPrompt.classList.remove('hidden');
    uploadPreview.classList.add('hidden');

    // Reset card preview
    cardPhotoImg.src = '';
    cardPhotoImg.classList.add('hidden');
    photoPlaceholder.classList.remove('hidden');
  });

  // 3.2 Hanja Convert logic
  const btnConvertHanja = document.getElementById('btnConvertHanja');
  const hanjaCandidates = document.getElementById('hanjaCandidates');

  if (btnConvertHanja && hanjaCandidates) {
    btnConvertHanja.addEventListener('click', () => {
      // If Hanja input is empty, fallback to Korean Name input
      let koreanName = inputHanjaName.value.trim();
      if (!koreanName) {
        koreanName = inputName.value.trim();
        if (koreanName) {
          inputHanjaName.value = koreanName;
        }
      }

      if (!koreanName) {
        alert('한자로 변환할 한글 성명을 먼저 입력해 주세요. (예: 홍길동)');
        inputName.focus();
        return;
      }

      // Check for Korean characters only
      if (!/^[가-힣]+$/.test(koreanName)) {
        alert('한글 성명만 자동 한자 변환을 지원합니다.');
        return;
      }

      // Parse letters
      const letters = koreanName.split('');
      hanjaCandidates.innerHTML = '';
      hanjaCandidates.classList.remove('hidden');

      // Track active selection array
      const currentHanjaArray = new Array(letters.length).fill('');

      letters.forEach((char, idx) => {
        const row = document.createElement('div');
        row.className = 'hanja-char-row';

        const label = document.createElement('span');
        label.className = 'hanja-char-label';
        label.textContent = char;
        row.appendChild(label);

        const btnList = document.createElement('div');
        btnList.className = 'hanja-btn-list';

        // Fetch candidates from dictionary. If missing, fall back to the Korean letter itself
        const candidates = (typeof HANJA_DICT !== 'undefined' && HANJA_DICT[char]) ? HANJA_DICT[char] : [char];

        // Default set to the first Hanja candidate
        currentHanjaArray[idx] = candidates[0];

        candidates.forEach((hanja, hIdx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn-hanja-candidate';
          if (hIdx === 0) btn.classList.add('active');
          btn.textContent = hanja;

          btn.addEventListener('click', () => {
            // Remove active from siblings
            btnList.querySelectorAll('.btn-hanja-candidate').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update array
            currentHanjaArray[idx] = hanja;

            // Combine and set value
            inputHanjaName.value = currentHanjaArray.join('');
            updateCardText(); // Sync preview immediately
          });

          btnList.appendChild(btn);
        });

        row.appendChild(btnList);
        hanjaCandidates.appendChild(row);
      });

      // Initialize input element with default combined candidates
      inputHanjaName.value = currentHanjaArray.join('');
      updateCardText();
    });
  }

  // Remove candidates box when form resets
  btnCloseModal.addEventListener('click', () => {
    paymentModal.classList.add('hidden');
    form.reset();
    btnRemoveFile.click();
    if (hanjaCandidates) hanjaCandidates.classList.add('hidden');
    updateCardText();
  });

  // 4. Form Submit API integration
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Helper to scroll smoothly and focus on the empty element
    const focusAndScroll = (el, message) => {
      alert(message);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        el.focus();
      }, 400); // Small timeout to wait for smooth scroll to finish
    };

    // 1. Korean Name Check
    const nameVal = inputName.value.trim();
    if (!nameVal) {
      focusAndScroll(inputName, '한글 성명을 입력해 주세요.');
      return;
    }

    // 2. Hanja Name Check
    const hanjaVal = inputHanjaName.value.trim();
    if (!hanjaVal) {
      focusAndScroll(inputHanjaName, '한자 성명을 입력해 주세요. (한자 변환 기능을 활용해 보세요.)');
      return;
    }

    // 3. Resident Number (Front) Check
    const birthVal = inputBirth.value.trim();
    if (birthVal.length !== 6 || !/^[0-9]+$/.test(birthVal)) {
      focusAndScroll(inputBirth, '주민등록번호 앞 6자리를 숫자로 정확히 입력해 주세요.');
      return;
    }

    // 4. Resident Number (Back) Check
    const birthBackVal = inputBirthBack.value.trim();
    if (birthBackVal.length !== 7 || !/^[0-9]+$/.test(birthBackVal)) {
      focusAndScroll(inputBirthBack, '주민등록번호 뒷 7자리를 숫자로 정확히 입력해 주세요.');
      return;
    }

    // 5. Address Check
    const addressVal = inputAddress.value.trim();
    if (!addressVal) {
      focusAndScroll(inputAddress, '주소를 입력해 주세요.');
      return;
    }

    // 6. Issue Date Check
    const issueDateVal = inputIssueDate.value.trim();
    if (!issueDateVal) {
      focusAndScroll(inputIssueDate, '발급 일자를 선택해 주세요.');
      return;
    }

    // 7. Issuing Authority Check
    const authorityVal = inputAuthority.value.trim();
    if (!authorityVal) {
      focusAndScroll(inputAuthority, '발급 기관을 입력해 주세요. (예: 마포구청장)');
      return;
    }

    // 8. Contact Phone Number Check
    const phoneVal = inputPhone.value.trim();
    if (!phoneVal || !/^[0-9-]{9,14}$/.test(phoneVal)) {
      focusAndScroll(inputPhone, '연락처(전화번호)를 정확히 입력해 주세요. (예: 010-1234-5678)');
      return;
    }

    // 9. Delivery Address Check
    const deliveryAddressVal = inputDeliveryAddress.value.trim();
    if (!deliveryAddressVal) {
      focusAndScroll(inputDeliveryAddress, '배송받을 주소를 입력해 주세요.');
      return;
    }

    // 10. Photo Upload Check (Custom drop panel)
    if (photoInput.files.length === 0) {
      alert('신분증 사진을 업로드해 주세요.');
      uploadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 11. Depositor Name Check
    const depositorVal = inputDepositor.value.trim();
    if (!depositorVal) {
      focusAndScroll(inputDepositor, '결제 입금자명을 입력해 주세요.');
      return;
    }

    // --- ALL CHECKS PASSED: Open Confirmation Overlay & Populate slots ---
    confirmName.textContent = `${nameVal} (${hanjaVal})`;
    confirmBirth.textContent = `${birthVal} - ${birthBackVal}`;
    confirmAddress.textContent = addressVal;
    
    // Format issue date (YYYY. MM. DD.)
    const dateParts = issueDateVal.split('-');
    confirmIssue.textContent = `${dateParts[0]}. ${dateParts[1]}. ${dateParts[2]}. / ${authorityVal}`;
    
    confirmPhone.textContent = phoneVal;
    confirmDeliveryAddress.textContent = deliveryAddressVal;
    confirmDepositor.textContent = depositorVal;
    confirmNote.textContent = inputNote.value.trim() || '없음 (요청사항 없음)';

    // Reset consent checkbox states
    agreeTerms.checked = false;
    btnFinalSubmit.disabled = true;

    // Show Confirmation Overlay
    confirmOrderModal.classList.remove('hidden');
  });

  // Checkbox state change listener
  if (agreeTerms && btnFinalSubmit) {
    agreeTerms.addEventListener('change', () => {
      btnFinalSubmit.disabled = !agreeTerms.checked;
    });
  }

  // Cancel Confirmation Button
  if (btnCancelConfirm) {
    btnCancelConfirm.addEventListener('click', () => {
      confirmOrderModal.classList.add('hidden');
    });
  }

  // Final submit handler inside confirmation overlay
  if (btnFinalSubmit) {
    btnFinalSubmit.addEventListener('click', async () => {
      const originalBtnText = btnFinalSubmit.innerHTML;
      btnFinalSubmit.disabled = true;
      btnFinalSubmit.innerHTML = '<span>입금 확인 중...</span> <div class="spinner"></div>';

      const formData = new FormData(form);

      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Hide Confirmation Modal
          confirmOrderModal.classList.add('hidden');

          // Populate success dialog details
          modalDepositor.textContent = result.order.depositor;
          modalDepositorConfirm.textContent = result.order.depositor;
          modalOrderCode.textContent = result.order.orderCode;

          // Open Success/Payment dialog
          paymentModal.classList.remove('hidden');
        } else {
          alert(result.error || '주문 제출에 실패했습니다. 다시 시도해 주세요.');
          btnFinalSubmit.disabled = false;
          btnFinalSubmit.innerHTML = originalBtnText;
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('네트워크 오류가 발생했습니다. 서버 연결 상태를 확인해 주세요.');
        btnFinalSubmit.disabled = false;
        btnFinalSubmit.innerHTML = originalBtnText;
      }
    });
  }

  // 5. Bank account copy to clipboard
  btnCopyAccount.addEventListener('click', () => {
    const accNum = document.getElementById('accountNumber').textContent;
    navigator.clipboard.writeText(accNum).then(() => {
      const copyText = btnCopyAccount.querySelector('.copy-text');
      const originalText = copyText.textContent;
      
      copyText.textContent = '완료!';
      btnCopyAccount.style.backgroundColor = 'var(--accent-cyan)';
      btnCopyAccount.style.color = '#fff';

      setTimeout(() => {
        copyText.textContent = originalText;
        btnCopyAccount.style.backgroundColor = '';
        btnCopyAccount.style.color = '';
      }, 1500);
    }).catch(err => {
      console.error('Failed to copy account number:', err);
    });
  });

  // 6. Close modal and reset form
  btnCloseModal.addEventListener('click', () => {
    paymentModal.classList.add('hidden');
    form.reset();
    
    // Reset photo file fields
    btnRemoveFile.click();
    
    // Reset all card previews to default values
    updateCardText();
  });

  // 7. Admin setting shortcut password prompt
  const adminShortcut = document.getElementById('adminShortcut');
  if (adminShortcut) {
    adminShortcut.addEventListener('click', (e) => {
      e.preventDefault();
      const pw = prompt('관리자 비밀번호를 입력하세요:');
      if (pw === 'khyfool') {
        sessionStorage.setItem('isAdmin', 'true');
        window.location.href = '/admin.html';
      } else if (pw !== null) {
        alert('비밀번호가 올바르지 않습니다.');
      }
    });
  }

  // 8. Run initial sync on load to map default values to the card preview
  updateCardText();
});
