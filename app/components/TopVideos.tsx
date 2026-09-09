type Video = {
  title: string;
  ctr: number;
  views: number;
  thumbnail?: string | null;
};

type TopVideosProps = {
  videos: Video[];
};

export default function TopVideos({ videos }: TopVideosProps) {
  return (
    <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 transition hover:border-zinc-700">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">
          Top Videos
        </h2>

        <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-500">
          {videos.length} {videos.length === 1 ? "video" : "videos"}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {videos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 px-6 py-10 text-center">
            <p className="text-sm text-zinc-500">
              No videos available.
            </p>
          </div>
        ) : (
          videos.map((video, index) => (
            <div
              key={`${video.title}-${index}`}
              className="group flex items-center gap-4 rounded-xl border border-transparent p-3 transition hover:border-zinc-800 hover:bg-zinc-950/50"
            >
              <div className="h-20 w-36 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                    No thumbnail
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium leading-6 text-zinc-100">
                  {video.title}
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />

                  <p className="text-sm text-zinc-500">
                    {video.ctr}% CTR
                  </p>
                </div>
              </div>

              <p className="shrink-0 text-sm font-semibold text-zinc-200">
                {video.views.toLocaleString()} views
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}