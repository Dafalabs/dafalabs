ADMIN = {"email": "admin@dafalabs.com", "password": "yoneticiParola1"}
MUSTERI = {"email": "musteri@example.com", "password": "cokGizliParola1"}

YENI = {
    "email": "yeni@sirket.com",
    "name": "Yeni Müşteri",
    "redirect_url": "https://panel.dafalabs.com/yeni",
    "is_admin": False,
    "is_active": True,
}


def test_oturumsuz_kullanici_listesi_kapali(client):
    assert client.get("/admin/users").status_code == 401


def test_musteri_kullanici_ekleyemiyor(client, user):
    client.post("/auth/login", json=MUSTERI)
    assert client.post("/admin/users", json=YENI).status_code == 403


def test_hesap_aciliyor_ve_parola_bir_kez_donuyor(client, admin):
    client.post("/auth/login", json=ADMIN)

    yanit = client.post("/admin/users", json=YENI)
    assert yanit.status_code == 201

    govde = yanit.json()
    assert govde["email"] == "yeni@sirket.com"
    assert len(govde["password"]) >= 12
    assert "password_hash" not in govde

    liste = client.get("/admin/users").json()
    assert all("password" not in kayit for kayit in liste)


def test_acilan_hesapla_giris_yapilabiliyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    parola = client.post("/admin/users", json=YENI).json()["password"]
    client.post("/auth/logout")

    yanit = client.post("/auth/login", json={"email": "yeni@sirket.com", "password": parola})
    assert yanit.status_code == 200
    assert yanit.json()["redirect_url"] == "https://panel.dafalabs.com/yeni"


def test_ayni_eposta_reddediliyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    client.post("/admin/users", json=YENI)
    assert client.post("/admin/users", json=YENI).status_code == 409


def test_parola_sifirlaniyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    kullanici_id = client.post("/admin/users", json=YENI).json()["id"]

    yeni_parola = client.post(f"/admin/users/{kullanici_id}/password").json()["password"]
    client.post("/auth/logout")

    assert client.post(
        "/auth/login", json={"email": "yeni@sirket.com", "password": yeni_parola}
    ).status_code == 200


def test_kendi_yetkisini_kaldiramiyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    ben = [k for k in client.get("/admin/users").json() if k["is_admin"]][0]

    yanit = client.patch(
        f"/admin/users/{ben['id']}",
        json={"name": "Yönetici", "redirect_url": "", "is_admin": False, "is_active": True},
    )
    assert yanit.status_code == 409


def test_kendi_hesabini_silemiyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    ben = [k for k in client.get("/admin/users").json() if k["is_admin"]][0]
    assert client.delete(f"/admin/users/{ben['id']}").status_code == 409


def test_baska_hesap_siliniyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    kullanici_id = client.post("/admin/users", json=YENI).json()["id"]

    assert client.delete(f"/admin/users/{kullanici_id}").status_code == 204
    assert all(k["email"] != "yeni@sirket.com" for k in client.get("/admin/users").json())


def test_pasife_alinan_hesap_giremiyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    olusan = client.post("/admin/users", json=YENI).json()

    client.patch(
        f"/admin/users/{olusan['id']}",
        json={"name": "Yeni Müşteri", "redirect_url": "", "is_admin": False, "is_active": False},
    )
    client.post("/auth/logout")

    assert client.post(
        "/auth/login", json={"email": "yeni@sirket.com", "password": olusan["password"]}
    ).status_code == 401
