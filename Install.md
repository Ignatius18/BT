# ByteClub

Добро пожаловать в репозиторий проекта **ByteClub**. Это веб-приложение, созданное для управления каталогом товаров, пользователями и заказами.

---

##  Технологический стек

* **Backend:** Java, Spring Boot, Spring Data JPA
* **Frontend:** HTML, CSS, JavaScript
* **Database:** MySQL
* **Build Tool:** Maven

---

##  Установка и запуск

### 1. Клонирование репозитория
```bash
git clone [https://github.com/ignatius18/ВТ.git](https://github.com/ignatius18/ВТ.git)
cd ВТ
```

### 2. Настройка базы данных
Создайте базу данных в MySQL (например, через MySQL Workbench или консоль):

```SQL
CREATE DATABASE byteclub_db;
```
Обновите настройки подключения в файле src/main/resources/application.properties:


```Properties
spring.datasource.url=jdbc:mysql://localhost:3306/byteclub_db?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=ваш_пароль
spring.jpa.hibernate.ddl-auto=update
```
### 3. Сборка проекта
Откройте проект в VS Code и выполните команду в терминале:

```Bash
mvn clean install
```

### 4. Запуск
Запустите приложение через Maven:

```Bash
mvn spring-boot:run
```

После запуска сайт будет доступен по ссылке ```https:/localhost:8080```


### Несколько советов по оформлению в VS Code:

1.  **Создание файла:** В корне вашего проекта в VS Code создайте файл с названием `README.md` (обязательно с большой буквы и расширением .md).
2.  **Предпросмотр:** Чтобы увидеть, как будет выглядеть текст, в VS Code нажмите на иконку **"Open Preview to the Side"** (значок файла с лупой в правом верхнем углу редактора). Это позволит вам сразу видеть результат форматирования.
3.  **Изображения:** Если вы хотите добавить скриншот работы сайта, просто перетащите файл картинки в папку проекта, закоммитьте его и добавьте в `README.md` строку:
    `![Название скриншота](путь/к/файлу.png)`

Этот код использует стандартный синтаксис **Markdown**, который GitHub автоматически распознает и красиво отображает на главной странице вашего репозитория.
