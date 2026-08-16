ADMIN = {"email": "admin@dafalabs.com", "password": "yoneticiParola1"}
MUSTERI = {"email": "musteri@example.com", "password": "cokGizliParola1"}


def test_oturumsuz_ayarlar_kapali(client):
    assert client.get("/admin/settings").status_code == 401


def test_musteri_ayar_degistiremiyor(client, user):
    client.post("/auth/login", json=MUSTERI)
    assert client.put("/admin/settings", json={"values": {"email": "x@y.com"}}).status_code == 403


def test_ayarlar_kaynagiyla_listeleniyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    kayitlar = {k["key"]: k for k in client.get("/admin/settings").json()}

    assert "logo" not in kayitlar
    assert kayitlar["email"]["value"] == ""
    assert kayitlar["email"]["source"] == "env"


def test_ayar_kaydediliyor_ve_siteye_yansiyor(client, admin):
    client.post("/auth/login", json=ADMIN)

    yanit = client.put(
        "/admin/settings",
        json={"values": {"email": "panel@dafalabs.com", "social_github": "https://github.com/x"}},
    )
    assert yanit.status_code == 200

    kayitlar = {k["key"]: k for k in yanit.json()}
    assert kayitlar["email"]["value"] == "panel@dafalabs.com"
    assert kayitlar["email"]["source"] == "db"

    contact = client.get("/site").json()["contact"]
    assert contact["email"] == "panel@dafalabs.com"
    assert contact["socials"][0]["href"] == "https://github.com/x"


def test_bos_deger_kaydi_siliyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    client.put("/admin/settings", json={"values": {"email": "panel@dafalabs.com"}})
    client.put("/admin/settings", json={"values": {"email": "   "}})

    kayitlar = {k["key"]: k for k in client.get("/admin/settings").json()}
    assert kayitlar["email"]["value"] == ""

    assert client.get("/site").json()["contact"]["email"] == "hello@dafalabs.com"


def test_bilinmeyen_ayar_reddediliyor(client, admin):
    client.post("/auth/login", json=ADMIN)
    assert client.put("/admin/settings", json={"values": {"uyduruk": "x"}}).status_code == 422
    assert client.put("/admin/settings", json={"values": {"logo": "/x.svg"}}).status_code == 422
