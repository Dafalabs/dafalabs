ADMIN = {"email": "admin@dafalabs.com", "password": "yoneticiParola1"}
MUSTERI = {"email": "musteri@example.com", "password": "cokGizliParola1"}

IKI_DILLI = {
    "slug": "iki-dilli-yazi",
    "title_tr": "Türkçe Başlık",
    "excerpt_tr": "Türkçe özet.",
    "body_tr": "# Başlık\n\nTürkçe gövde metni. " + "kelime " * 180,
    "title_en": "English Title",
    "excerpt_en": "English summary.",
    "body_en": "# Heading\n\nEnglish body text.",
    "tags": ["Flutter"],
    "is_published": True,
}

SADECE_TR = {
    "slug": "sadece-turkce",
    "title_tr": "Yalnız Türkçe",
    "excerpt_tr": "Bu yazı sadece Türkçe.",
    "body_tr": "Türkçe gövde.",
    "title_en": "",
    "excerpt_en": "",
    "body_en": "",
    "is_published": True,
}


def test_oturumsuz_yazi_yonetimi_kapali(client):
    assert client.get("/admin/posts").status_code == 401


def test_musteri_yazi_ekleyemiyor(client, user):
    client.post("/auth/login", json=MUSTERI)
    assert client.post("/admin/posts", json=IKI_DILLI).status_code == 403


def test_yazi_ekleniyor(client, admin):
    client.post("/auth/login", json=ADMIN)

    yanit = client.post("/admin/posts", json=IKI_DILLI)
    assert yanit.status_code == 201
    assert yanit.json()["locales"] == ["tr", "en"]
    assert yanit.json()["published_at"] is not None


def test_tek_dilli_yazi_sadece_o_dilde_gorunuyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    client.post("/admin/posts", json=SADECE_TR)
    client.post("/auth/logout")

    tr = client.get("/yazilar", params={"locale": "tr"}).json()
    en = client.get("/yazilar", params={"locale": "en"}).json()

    assert [p["slug"] for p in tr] == ["sadece-turkce"]
    assert en == []


def test_tek_dilli_yazinin_diger_dili_404(client, admin):
    client.post("/auth/login", json=ADMIN)
    client.post("/admin/posts", json=SADECE_TR)
    client.post("/auth/logout")

    assert client.get("/yazilar/sadece-turkce", params={"locale": "tr"}).status_code == 200
    assert client.get("/yazilar/sadece-turkce", params={"locale": "en"}).status_code == 404


def test_iki_dilli_yazi_her_iki_dilde(client, admin):
    client.post("/auth/login", json=ADMIN)
    client.post("/admin/posts", json=IKI_DILLI)
    client.post("/auth/logout")

    tr = client.get("/yazilar/iki-dilli-yazi", params={"locale": "tr"}).json()
    en = client.get("/yazilar/iki-dilli-yazi", params={"locale": "en"}).json()

    assert tr["title"] == "Türkçe Başlık"
    assert en["title"] == "English Title"
    assert tr["locales"] == ["tr", "en"]


def test_yayinda_olmayan_yazi_gizli(client, admin):
    client.post("/auth/login", json=ADMIN)
    client.post("/admin/posts", json={**IKI_DILLI, "is_published": False})
    client.post("/auth/logout")

    assert client.get("/yazilar", params={"locale": "tr"}).json() == []
    assert client.get("/yazilar/iki-dilli-yazi", params={"locale": "tr"}).status_code == 404


def test_okuma_suresi_hesaplaniyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    client.post("/admin/posts", json=IKI_DILLI)
    client.post("/auth/logout")

    tr = client.get("/yazilar/iki-dilli-yazi", params={"locale": "tr"}).json()
    en = client.get("/yazilar/iki-dilli-yazi", params={"locale": "en"}).json()

    assert tr["reading_minutes"] == 1
    assert en["reading_minutes"] == 1


def test_basligi_olup_govdesi_olmayan_dil_sayilmiyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    yanit = client.post(
        "/admin/posts",
        json={**SADECE_TR, "slug": "yarim", "title_en": "Only a title", "body_en": "   "},
    )

    assert yanit.json()["locales"] == ["tr"]


def test_ayni_slug_reddediliyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    client.post("/admin/posts", json=IKI_DILLI)
    assert client.post("/admin/posts", json=IKI_DILLI).status_code == 409


def test_yazi_guncelleniyor_ve_siliniyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    post_id = client.post("/admin/posts", json=IKI_DILLI).json()["id"]

    yanit = client.patch(f"/admin/posts/{post_id}", json={**IKI_DILLI, "title_tr": "Yeni"})
    assert yanit.json()["title_tr"] == "Yeni"

    assert client.delete(f"/admin/posts/{post_id}").status_code == 204
    assert client.get("/admin/posts").json() == []


def test_yayin_tarihi_bir_kez_isaretleniyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    post_id = client.post("/admin/posts", json={**IKI_DILLI, "is_published": False}).json()["id"]

    ilk = client.patch(f"/admin/posts/{post_id}", json={**IKI_DILLI, "is_published": True}).json()
    assert ilk["published_at"] is not None

    client.patch(f"/admin/posts/{post_id}", json={**IKI_DILLI, "is_published": False})
    tekrar = client.patch(f"/admin/posts/{post_id}", json={**IKI_DILLI, "is_published": True}).json()
    assert tekrar["published_at"] == ilk["published_at"]
