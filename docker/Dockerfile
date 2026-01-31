FROM docker.cnb.cool/yuwen-gueen/docker-images-chrom/golang:1.24-alpine_amd64

# 安装基础工具和运行依赖
RUN apk add --no-cache make bash git libc6-compat libstdc++ libgcc

# 复制本地 hugo 可执行文件（从 bin/linux 目录）
COPY bin/linux/hugo /usr/local/bin/hugo

# 复制新的统一工具到 /usr/bin
COPY bin/linux/hugo-teek-tools /usr/bin/hugo-teek-tools

# 确保所有二进制文件有执行权限
RUN chmod +x /usr/local/bin/hugo /usr/bin/hugo-teek-tools

# 设置构建环境变量
ENV HUGO_ENABLEGITINFO=false
ENV CGO_ENABLED=0
ENV GO111MODULE=on
ENV GOPROXY=https://goproxy.cn,direct

# 设置工作目录
WORKDIR /workspace

# 复制项目文件（你可以根据需要取消注释）
# COPY . .

# 默认执行 make clean，再执行 make build-docker
ENTRYPOINT ["bash", "-c", "make clean && make build-docker"]
