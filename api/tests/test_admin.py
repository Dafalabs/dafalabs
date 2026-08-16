GECERLI_FORM = {
    "name": "Ayşe Yılmaz",
    "email": "ayse@example.com",
    "subject": "Mobil uygulama",
    "message": "Merhaba, bir uygulama yaptırmak istiyorum.",
}

ADMIN = {"email": "admin@dafalabs.com", "password": "yoneticiParola1"}
MUSTERI = {"email": "musteri@example.com", "password": "cokGizliParola1"}


def test_oturumsuz_panel_kapali(client):
    assert client.get("/admin/messages").status_code == 401


def test_musteri_panele_giremiyor(client, user):
    client.post("/auth/login", json=MUSTERI)
    assert client.get("/admin/messages").status_code == 403


def test_yonetici_mesajlari_goruyor(client, admin):
    client.post("/iletisim", json=GECERLI_FORM)
    client.post("/auth/login", json=ADMIN)

    data = client.get("/admin/messages").json()

    assert data["total"] == 1
    assert data["items"][0]["email"] == "ayse@example.com"
    assert data["items"][0]["message"].startswith("Merhaba")
    assert data["counts"]["received"] == 1


def test_giris_yoneticiyi_isaretliyor(client, admin):
    assert client.post("/auth/login", json=ADMIN).json()["is_admin"] is True


def test_musteri_yonetici_degil(client, user):
    assert client.post("/auth/login", json=MUSTERI).json()["is_admin"] is False


def test_durum_guncelleniyor(client, admin):
    client.post("/iletisim", json=GECERLI_FORM)
    client.post("/auth/login", json=ADMIN)

    mesaj_id = client.get("/admin/messages").json()["items"][0]["id"]
    yanit = client.patch(f"/admin/messages/{mesaj_id}", json={"status": "answered"})

    assert yanit.status_code == 200
    assert yanit.json()["status"] == "answered"
    assert yanit.json()["answered_at"] is not None


def test_gecersiz_durum_reddediliyor(client, admin):
    client.post("/iletisim", json=GECERLI_FORM)
    client.post("/auth/login", json=ADMIN)

    mesaj_id = client.get("/admin/messages").json()["items"][0]["id"]
    assert client.patch(f"/admin/messages/{mesaj_id}", json={"status": "uyduruk"}).status_code == 422


def test_musteri_durum_degistiremiyor(client, admin, user):
    client.post("/iletisim", json=GECERLI_FORM)
    client.post("/auth/login", json=ADMIN)
    mesaj_id = client.get("/admin/messages").json()["items"][0]["id"]

    client.post("/auth/logout")
    client.post("/auth/login", json=MUSTERI)

    assert client.patch(f"/admin/messages/{mesaj_id}", json={"status": "closed"}).status_code == 403


def test_durum_filtresi_ve_arama(client, admin):
    client.post("/iletisim", json=GECERLI_FORM)
    client.post("/iletisim", json={**GECERLI_FORM, "name": "Başka Kişi", "email": "baska@example.com"})
    client.post("/auth/login", json=ADMIN)

    assert client.get("/admin/messages", params={"ara": "baska@"}).json()["total"] == 1
    assert client.get("/admin/messages", params={"durum": "answered"}).json()["total"] == 0
    assert client.get("/admin/messages", params={"durum": "received"}).json()["total"] == 2
