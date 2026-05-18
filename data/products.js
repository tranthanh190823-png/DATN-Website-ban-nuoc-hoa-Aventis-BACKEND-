const products = [
  // ===== CHANEL =====
  {
    name: 'Chanel No.5 Eau de Parfum',
    brand: 'CHANEL', gender: 'Nu', type: 'Full',
    scentCategory: 'Hoa',
    scentNotes: ['Hoa hong', 'Hoa nhai', 'Go dan huong', 'Vanilla'],
    origin: 'Phap',
    description: 'Bieu tuong quyen ru vuot thoi gian, su ket hop hoan hao cua cac loai hoa quy gia voi go dan huong sang trong.',
    images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 320000,  salePrice: 280000,  stock: 100 },
      { ml: 20,  label: '20ml (Chiet)',    price: 580000,  salePrice: 500000,  stock: 80  },
      { ml: 30,  label: '30ml (Chiet)',    price: 850000,  salePrice: 750000,  stock: 60  },
      { ml: 100, label: '100ml (Full box)',price: 4500000, salePrice: 4200000, stock: 30  }
    ],
    price: 4500000, salePrice: 4200000, stock: 30, rating: 4.9, isHot: true, isSale: true
  },
  {
    name: 'Bleu de Chanel Eau de Parfum',
    brand: 'CHANEL', gender: 'Nam', type: 'Full',
    scentCategory: 'Go',
    scentNotes: ['Go dan huong', 'Go tuyet tung', 'Buoi', 'Chanh vang'],
    origin: 'Phap',
    description: 'Mui huong dang cap va hien dai cua nguoi dan ong Phap, huong go am ap hoa quyen cung trai cay tuoi mat.',
    images: ['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 320000,  salePrice: 290000,  stock: 120 },
      { ml: 20,  label: '20ml (Chiet)',    price: 580000,  salePrice: 520000,  stock: 90  },
      { ml: 30,  label: '30ml (Chiet)',    price: 860000,  salePrice: 760000,  stock: 70  },
      { ml: 100, label: '100ml (Full box)',price: 4200000, salePrice: 4200000, stock: 40  }
    ],
    price: 4200000, salePrice: 4200000, stock: 40, rating: 4.9, isHot: true, isSale: false
  },
  {
    name: 'Chanel Chance Eau Tendre',
    brand: 'CHANEL', gender: 'Nu', type: 'Full',
    scentCategory: 'Cam',
    scentNotes: ['Cam Bergamot', 'Buoi', 'Hoa nhai', 'Hoac huong'],
    origin: 'Phap',
    description: 'Huong cam tuoi mat, tre trung va rang ro day nang luong danh cho co gai hien dai.',
    images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 300000,  salePrice: 260000,  stock: 90  },
      { ml: 20,  label: '20ml (Chiet)',    price: 550000,  salePrice: 480000,  stock: 70  },
      { ml: 30,  label: '30ml (Chiet)',    price: 800000,  salePrice: 700000,  stock: 50  },
      { ml: 100, label: '100ml (Full box)',price: 4300000, salePrice: 3900000, stock: 25  }
    ],
    price: 4300000, salePrice: 3900000, stock: 25, rating: 4.8, isHot: true, isSale: true
  },
  // ===== DIOR =====
  {
    name: 'Dior Sauvage Eau de Parfum',
    brand: 'DIOR', gender: 'Nam', type: 'Full',
    scentCategory: 'Go',
    scentNotes: ['Cam Bergamot', 'Go tuyet tung', 'Tieu Tu Xuyen', 'Ambroxan'],
    origin: 'Phap',
    description: 'Mui huong nam tinh, manh me va hoang da. Cam Bergamot tuoi mat hoa quyen voi huong go tuyet tung am ap.',
    images: ['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 300000,  salePrice: 260000,  stock: 150 },
      { ml: 20,  label: '20ml (Chiet)',    price: 560000,  salePrice: 490000,  stock: 120 },
      { ml: 30,  label: '30ml (Chiet)',    price: 820000,  salePrice: 720000,  stock: 80  },
      { ml: 100, label: '100ml (Full box)',price: 3600000, salePrice: 3200000, stock: 50  }
    ],
    price: 3600000, salePrice: 3200000, stock: 50, rating: 4.8, isHot: true, isSale: true
  },
  {
    name: 'Miss Dior Blooming Bouquet',
    brand: 'DIOR', gender: 'Nu', type: 'Full',
    scentCategory: 'Hoa',
    scentNotes: ['Hoa hong', 'Hoa mau don', 'Hoa nhai', 'Xa huong trang'],
    origin: 'Phap',
    description: 'Bo hoa phuc sinh duyen dang, ngot ngao nhu nang cuoi cua co gai Phap rang ro.',
    images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 280000,  salePrice: 240000,  stock: 100 },
      { ml: 20,  label: '20ml (Chiet)',    price: 520000,  salePrice: 450000,  stock: 80  },
      { ml: 30,  label: '30ml (Chiet)',    price: 760000,  salePrice: 660000,  stock: 60  },
      { ml: 100, label: '100ml (Full box)',price: 3500000, salePrice: 3100000, stock: 35  }
    ],
    price: 3500000, salePrice: 3100000, stock: 35, rating: 4.7, isHot: false, isSale: true
  },
  {
    name: 'Dior Joy Eau de Parfum',
    brand: 'DIOR', gender: 'Nu', type: 'Full',
    scentCategory: 'Ngot',
    scentNotes: ['Vanilla', 'Hoa hong', 'Xa huong', 'Gac mi dinh huong'],
    origin: 'Phap',
    description: 'Niem vui thuan khiet, vanilla am ap bao boc trong lop hoa hong quy phai va xa huong sang trong.',
    images: ['https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 260000,  salePrice: 220000,  stock: 80  },
      { ml: 20,  label: '20ml (Chiet)',    price: 480000,  salePrice: 420000,  stock: 60  },
      { ml: 30,  label: '30ml (Chiet)',    price: 700000,  salePrice: 610000,  stock: 45  },
      { ml: 100, label: '100ml (Full box)',price: 3400000, salePrice: 3000000, stock: 20  }
    ],
    price: 3400000, salePrice: 3000000, stock: 20, rating: 4.6, isHot: false, isSale: true
  },
  // ===== GUCCI =====
  {
    name: 'Gucci Bloom Eau de Parfum',
    brand: 'GUCCI', gender: 'Nu', type: 'Full',
    scentCategory: 'Hoa',
    scentNotes: ['Hoa nhai', 'Hoa hue', 'Hoa su quan tu', 'Re cay dien vi'],
    origin: 'Y',
    description: 'Khu vuon hoa ruc ro cua nuoc Y, huong hoa thien nhien tuoi mat trong phong cach sang trong.',
    images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 200000,  salePrice: 170000,  stock: 120 },
      { ml: 20,  label: '20ml (Chiet)',    price: 380000,  salePrice: 330000,  stock: 90  },
      { ml: 30,  label: '30ml (Chiet)',    price: 560000,  salePrice: 480000,  stock: 70  },
      { ml: 100, label: '100ml (Full box)',price: 2500000, salePrice: 2200000, stock: 40  }
    ],
    price: 2500000, salePrice: 2200000, stock: 40, rating: 4.5, isHot: false, isSale: true
  },
  {
    name: 'Gucci Guilty Eau de Parfum',
    brand: 'GUCCI', gender: 'Nam', type: 'Full',
    scentCategory: 'Go',
    scentNotes: ['Chanh vang', 'Oai huong', 'Go dan huong', 'Xa huong'],
    origin: 'Y',
    description: 'Chanh vang sang khoai ket hop go dan huong am ap, the hien ban linh nguoi dan ong tu tin hien dai.',
    images: ['https://images.unsplash.com/photo-1615397323114-1e0e181e5927?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 200000,  salePrice: 175000,  stock: 100 },
      { ml: 20,  label: '20ml (Chiet)',    price: 370000,  salePrice: 320000,  stock: 75  },
      { ml: 30,  label: '30ml (Chiet)',    price: 545000,  salePrice: 470000,  stock: 55  },
      { ml: 100, label: '100ml (Full box)',price: 2600000, salePrice: 2300000, stock: 30  }
    ],
    price: 2600000, salePrice: 2300000, stock: 30, rating: 4.6, isHot: true, isSale: true
  },
  {
    name: 'Gucci Flora Gorgeous Gardenia',
    brand: 'GUCCI', gender: 'Unisex', type: 'Full',
    scentCategory: 'Ngot',
    scentNotes: ['Dao', 'Hoa gardenia', 'Caramel', 'Vanilla'],
    origin: 'Y',
    description: 'Vuon hoa gardenia ngot ngao quy phai, diem xen huong dao chin mu mat va caramel am ap.',
    images: ['https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 210000,  salePrice: 180000,  stock: 90  },
      { ml: 20,  label: '20ml (Chiet)',    price: 390000,  salePrice: 340000,  stock: 70  },
      { ml: 30,  label: '30ml (Chiet)',    price: 570000,  salePrice: 490000,  stock: 50  },
      { ml: 100, label: '100ml (Full box)',price: 2700000, salePrice: 2400000, stock: 25  }
    ],
    price: 2700000, salePrice: 2400000, stock: 25, rating: 4.7, isHot: true, isSale: true
  },
  // ===== HERMES =====
  {
    name: "Hermes Terre d'Hermes EDP",
    brand: 'HERMES', gender: 'Nam', type: 'Full',
    scentCategory: 'Cam',
    scentNotes: ['Cam tuoi', 'Buoi', 'Tieu', 'Go tuyet tung'],
    origin: 'Phap',
    description: 'Huong vi cua dat troi, ket hop su tuoi mat cua cam quyt voi suc manh nam tinh cua go tuyet tung.',
    images: ['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 280000,  salePrice: 240000,  stock: 80  },
      { ml: 20,  label: '20ml (Chiet)',    price: 520000,  salePrice: 450000,  stock: 60  },
      { ml: 30,  label: '30ml (Chiet)',    price: 760000,  salePrice: 660000,  stock: 45  },
      { ml: 100, label: '100ml (Full box)',price: 3800000, salePrice: 3400000, stock: 25  }
    ],
    price: 3800000, salePrice: 3400000, stock: 25, rating: 4.8, isHot: true, isSale: true
  },
  {
    name: "Hermes Twilly d'Hermes EDP",
    brand: 'HERMES', gender: 'Nu', type: 'Full',
    scentCategory: 'Hoa',
    scentNotes: ['Hoa gung', 'Hoa hue', 'Go dan huong', 'Xa huong'],
    origin: 'Phap',
    description: 'Nang dong, vui tuoi va phong khoang nhu chiec khan twilly thu truyen cua Hermes.',
    images: ['https://images.unsplash.com/photo-1595425959632-ce1517441865?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 270000,  salePrice: 230000,  stock: 70  },
      { ml: 20,  label: '20ml (Chiet)',    price: 500000,  salePrice: 430000,  stock: 55  },
      { ml: 30,  label: '30ml (Chiet)',    price: 730000,  salePrice: 630000,  stock: 40  },
      { ml: 100, label: '100ml (Full box)',price: 3600000, salePrice: 3200000, stock: 20  }
    ],
    price: 3600000, salePrice: 3200000, stock: 20, rating: 4.7, isHot: false, isSale: true
  },
  {
    name: 'Hermes Un Jardin Sur Le Nil',
    brand: 'HERMES', gender: 'Unisex', type: 'Full',
    scentCategory: 'Cam',
    scentNotes: ['Cam bergamot', 'Hoa sen', 'Man cau', 'Go xanh'],
    origin: 'Phap',
    description: 'Khu vuon tren song Nile huyen ao, huong cam bergamot va hoa tuoi mat nhu gio thoi tren dong nuoc.',
    images: ['https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 260000,  salePrice: 220000,  stock: 60  },
      { ml: 20,  label: '20ml (Chiet)',    price: 480000,  salePrice: 410000,  stock: 45  },
      { ml: 30,  label: '30ml (Chiet)',    price: 700000,  salePrice: 600000,  stock: 35  },
      { ml: 100, label: '100ml (Full box)',price: 3500000, salePrice: 3100000, stock: 15  }
    ],
    price: 3500000, salePrice: 3100000, stock: 15, rating: 4.6, isHot: false, isSale: true
  },
  // ===== YSL =====
  {
    name: 'YSL Libre Eau de Parfum',
    brand: 'YSL', gender: 'Nu', type: 'Full',
    scentCategory: 'Hoa',
    scentNotes: ['Hoa oai huong Maroc', 'Hoa cam', 'Xa huong', 'Vanilla'],
    origin: 'Phap',
    description: 'Tu do va manh me, hoa oai huong Maroc hoa quyen cung hoa cam va xa huong am ap day quyen ru.',
    images: ['https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 250000,  salePrice: 210000,  stock: 100 },
      { ml: 20,  label: '20ml (Chiet)',    price: 460000,  salePrice: 400000,  stock: 80  },
      { ml: 30,  label: '30ml (Chiet)',    price: 680000,  salePrice: 590000,  stock: 60  },
      { ml: 100, label: '100ml (Full box)',price: 3200000, salePrice: 2900000, stock: 35  }
    ],
    price: 3200000, salePrice: 2900000, stock: 35, rating: 4.8, isHot: true, isSale: true
  },
  {
    name: 'YSL Y Eau de Parfum',
    brand: 'YSL', gender: 'Nam', type: 'Full',
    scentCategory: 'Go',
    scentNotes: ['Tao xanh', 'Gung', 'Xo thom', 'Go tuyet tung'],
    origin: 'Phap',
    description: 'Nguoi dan ong hien dai, tu tin va day hoai bao voi huong gung tao xanh sang khoai tren nen go.',
    images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 250000,  salePrice: 210000,  stock: 110 },
      { ml: 20,  label: '20ml (Chiet)',    price: 460000,  salePrice: 400000,  stock: 85  },
      { ml: 30,  label: '30ml (Chiet)',    price: 680000,  salePrice: 590000,  stock: 65  },
      { ml: 100, label: '100ml (Full box)',price: 3200000, salePrice: 2900000, stock: 40  }
    ],
    price: 3200000, salePrice: 2900000, stock: 40, rating: 4.7, isHot: false, isSale: true
  },
  {
    name: 'YSL Black Opium Eau de Parfum',
    brand: 'YSL', gender: 'Nu', type: 'Full',
    scentCategory: 'Ngot',
    scentNotes: ['Ca phe', 'Vanilla', 'Hoa hong trang', 'Xa huong'],
    origin: 'Phap',
    description: 'Nghien ngam va quyen ru, huong ca phe dam dam ket hop vanilla ngot ngao day bi an va cuon hut.',
    images: ['https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 240000,  salePrice: 200000,  stock: 130 },
      { ml: 20,  label: '20ml (Chiet)',    price: 440000,  salePrice: 380000,  stock: 100 },
      { ml: 30,  label: '30ml (Chiet)',    price: 650000,  salePrice: 560000,  stock: 75  },
      { ml: 100, label: '100ml (Full box)',price: 3000000, salePrice: 2700000, stock: 45  }
    ],
    price: 3000000, salePrice: 2700000, stock: 45, rating: 4.7, isHot: true, isSale: true
  },
  // ===== AFNAN =====
  {
    name: 'Afnan 9PM Eau de Parfum',
    brand: 'AFNAN', gender: 'Nam', type: 'Full',
    scentCategory: 'Ngot',
    scentNotes: ['Dau Tonka', 'Vanilla', 'Go dan huong', 'Cam Bergamot'],
    origin: 'UAE',
    description: 'Mui huong da lat hap dan, vanilla va dau Tonka ngot ngao tren nen go am cuon hut kho cuong.',
    images: ['https://images.unsplash.com/photo-1615397323114-1e0e181e5927?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 120000,  salePrice: 99000,   stock: 200 },
      { ml: 20,  label: '20ml (Chiet)',    price: 220000,  salePrice: 185000,  stock: 150 },
      { ml: 30,  label: '30ml (Chiet)',    price: 320000,  salePrice: 270000,  stock: 100 },
      { ml: 100, label: '100ml (Full box)',price: 1200000, salePrice: 990000,  stock: 60  }
    ],
    price: 1200000, salePrice: 990000, stock: 60, rating: 4.5, isHot: true, isSale: true
  },
  {
    name: 'Afnan Supremacy Silver',
    brand: 'AFNAN', gender: 'Nam', type: 'Full',
    scentCategory: 'Cam',
    scentNotes: ['Cam bergamot', 'Chanh vang', 'Hoa oai huong', 'Go tuyet tung'],
    origin: 'UAE',
    description: 'Sang trong nhu bac, huong citrus tuoi mat cung la cam dat va go sach se tinh te.',
    images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 110000,  salePrice: 90000,   stock: 180 },
      { ml: 20,  label: '20ml (Chiet)',    price: 200000,  salePrice: 165000,  stock: 140 },
      { ml: 30,  label: '30ml (Chiet)',    price: 295000,  salePrice: 245000,  stock: 90  },
      { ml: 100, label: '100ml (Full box)',price: 1100000, salePrice: 900000,  stock: 55  }
    ],
    price: 1100000, salePrice: 900000, stock: 55, rating: 4.4, isHot: false, isSale: true
  },
  {
    name: 'Afnan Turathi Blue',
    brand: 'AFNAN', gender: 'Unisex', type: 'Full',
    scentCategory: 'Hoa',
    scentNotes: ['Hoa hong', 'Oud', 'Xa huong', 'Gao'],
    origin: 'UAE',
    description: 'Di san van hoa A Rap quy gia, hoa hong quy phai hoa quyen cung Oud va xa huong bay bong.',
    images: ['https://images.unsplash.com/photo-1595425959632-ce1517441865?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 115000,  salePrice: 95000,   stock: 160 },
      { ml: 20,  label: '20ml (Chiet)',    price: 210000,  salePrice: 175000,  stock: 120 },
      { ml: 30,  label: '30ml (Chiet)',    price: 305000,  salePrice: 255000,  stock: 80  },
      { ml: 100, label: '100ml (Full box)',price: 1150000, salePrice: 950000,  stock: 50  }
    ],
    price: 1150000, salePrice: 950000, stock: 50, rating: 4.3, isHot: false, isSale: true
  },
  {
    name: 'Afnan 9AM Eau de Parfum',
    brand: 'AFNAN', gender: 'Nu', type: 'Full',
    scentCategory: 'Hoa',
    scentNotes: ['Hoa hong', 'Hoa nhai', 'Trai cay tuoi', 'Xa huong'],
    origin: 'UAE',
    description: 'Buoi sang tuoi sang, hoa hong va hoa nhai nhay mua tren nen trai cay va xa huong sang trong.',
    images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800'],
    volumes: [
      { ml: 10,  label: '10ml (Chiet)',    price: 110000,  salePrice: 90000,   stock: 170 },
      { ml: 20,  label: '20ml (Chiet)',    price: 200000,  salePrice: 165000,  stock: 130 },
      { ml: 30,  label: '30ml (Chiet)',    price: 295000,  salePrice: 245000,  stock: 85  },
      { ml: 100, label: '100ml (Full box)',price: 1100000, salePrice: 890000,  stock: 50  }
    ],
    price: 1100000, salePrice: 890000, stock: 50, rating: 4.4, isHot: false, isSale: true
  }
];

export default products;
